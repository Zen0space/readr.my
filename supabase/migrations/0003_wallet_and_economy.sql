create type public.coin_purchase_status as enum ('pending', 'succeeded', 'failed');
create type public.subscription_status as enum ('active', 'cancelled', 'expired', 'past_due');

-- Singleton-style config for the coin economy.
-- Defaults from dev-phase0.md: RM1 = 10 coins, author cut 70%.
create table public.coin_config (
  id smallint primary key default 1 check (id = 1),
  coins_per_rm int not null default 10 check (coins_per_rm > 0),
  author_cut_pct int not null default 70 check (author_cut_pct between 0 and 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);
insert into public.coin_config (id) values (1) on conflict do nothing;

create trigger coin_config_touch_updated_at
  before update on public.coin_config
  for each row execute function public.touch_updated_at();

-- Wallet: one row per user, holds coin balance.
create table public.wallets (
  user_id uuid primary key references public.users(id) on delete cascade,
  coin_balance bigint not null default 0 check (coin_balance >= 0),
  updated_at timestamptz not null default now()
);

create trigger wallets_touch_updated_at
  before update on public.wallets
  for each row execute function public.touch_updated_at();

-- Auto-create wallet when public.users row is created.
create or replace function public.handle_new_user_wallet() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger users_create_wallet
  after insert on public.users
  for each row execute function public.handle_new_user_wallet();

-- Top-up purchases (RM -> coins). Status driven by payment webhook.
create table public.coin_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  pack_rm_cents int not null check (pack_rm_cents > 0),
  coins int not null check (coins > 0),
  status public.coin_purchase_status not null default 'pending',
  processor text not null,
  processor_ref text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  succeeded_at timestamptz,
  failed_at timestamptz,
  failure_reason text
);
create unique index coin_purchases_idem_key on public.coin_purchases (processor, idempotency_key);
create index coin_purchases_user_recent_idx on public.coin_purchases (user_id, created_at desc);
create index coin_purchases_pending_idx on public.coin_purchases (created_at) where status = 'pending';

-- Chapter unlocks (coins spent to read a coin-gated chapter)
create table public.chapter_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  coins_paid int not null check (coins_paid > 0),
  author_cut_coins int not null check (author_cut_coins >= 0),
  unlocked_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);
create index chapter_unlocks_chapter_idx on public.chapter_unlocks (chapter_id, unlocked_at desc);
create index chapter_unlocks_user_idx on public.chapter_unlocks (user_id, unlocked_at desc);

-- Subscriptions: per-author for v0 (platform-wide tier deferred).
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.users(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  status public.subscription_status not null default 'active',
  price_rm_cents int not null check (price_rm_cents > 0),
  started_at timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancelled_at timestamptz,
  processor text not null,
  processor_ref text,
  constraint subscriptions_no_self check (subscriber_id <> author_id)
);
create unique index subscriptions_active_unique
  on public.subscriptions (subscriber_id, author_id)
  where status = 'active';
create index subscriptions_author_idx on public.subscriptions (author_id, status);
create index subscriptions_period_end_idx on public.subscriptions (current_period_end) where status = 'active';

-- Atomic coin spend: deducts balance and records the unlock in one transaction.
-- API layer must additionally take a Redis per-user lock around the call.
create or replace function public.spend_coins_for_unlock(
  p_user_id uuid,
  p_chapter_id uuid
) returns public.chapter_unlocks
  language plpgsql security definer set search_path = public as $$
declare
  v_chapter public.chapters%rowtype;
  v_cut_pct int;
  v_author_cut int;
  v_balance bigint;
  v_unlock public.chapter_unlocks%rowtype;
begin
  select * into v_chapter from public.chapters where id = p_chapter_id for update;
  if not found then
    raise exception 'chapter_not_found' using errcode = 'P0002';
  end if;
  if v_chapter.gating <> 'coin' then
    raise exception 'chapter_not_coin_gated' using errcode = 'P0001';
  end if;
  if v_chapter.published_at is null then
    raise exception 'chapter_not_published' using errcode = 'P0001';
  end if;

  -- Already unlocked? Return existing.
  select * into v_unlock from public.chapter_unlocks
    where user_id = p_user_id and chapter_id = p_chapter_id;
  if found then
    return v_unlock;
  end if;

  select author_cut_pct into v_cut_pct from public.coin_config where id = 1;
  v_author_cut := floor(v_chapter.price_coins * v_cut_pct / 100.0);

  update public.wallets
    set coin_balance = coin_balance - v_chapter.price_coins
    where user_id = p_user_id and coin_balance >= v_chapter.price_coins
    returning coin_balance into v_balance;

  if not found then
    raise exception 'insufficient_coins' using errcode = 'P0001';
  end if;

  insert into public.chapter_unlocks (user_id, chapter_id, coins_paid, author_cut_coins)
    values (p_user_id, p_chapter_id, v_chapter.price_coins, v_author_cut)
    returning * into v_unlock;

  return v_unlock;
end $$;

-- RLS
alter table public.coin_config enable row level security;
alter table public.wallets enable row level security;
alter table public.coin_purchases enable row level security;
alter table public.chapter_unlocks enable row level security;
alter table public.subscriptions enable row level security;

-- Coin config: everyone reads; only admin writes
create policy coin_config_public_read on public.coin_config
  for select to anon, authenticated using (true);
create policy coin_config_admin_write on public.coin_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Wallets: owner reads own; admin reads all; no client writes (use service role + spend_coins_for_unlock)
create policy wallets_owner_read on public.wallets
  for select to authenticated using (user_id = auth.uid());
create policy wallets_admin_read on public.wallets
  for select to authenticated using (public.is_admin());

-- Coin purchases: owner reads own; admin reads all
create policy coin_purchases_owner_read on public.coin_purchases
  for select to authenticated using (user_id = auth.uid());
create policy coin_purchases_admin_read on public.coin_purchases
  for select to authenticated using (public.is_admin());

-- Chapter unlocks: owner reads own; author reads unlocks for their chapters (for earnings); admin all
create policy chapter_unlocks_owner_read on public.chapter_unlocks
  for select to authenticated using (user_id = auth.uid());
create policy chapter_unlocks_author_read on public.chapter_unlocks
  for select to authenticated using (
    exists (
      select 1 from public.chapters c
      join public.stories s on s.id = c.story_id
      where c.id = chapter_unlocks.chapter_id and s.author_id = auth.uid()
    )
  );
create policy chapter_unlocks_admin_read on public.chapter_unlocks
  for select to authenticated using (public.is_admin());

-- Subscriptions: subscriber and author both read; admin all
create policy subscriptions_subscriber_read on public.subscriptions
  for select to authenticated using (subscriber_id = auth.uid());
create policy subscriptions_author_read on public.subscriptions
  for select to authenticated using (author_id = auth.uid());
create policy subscriptions_admin_all on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

comment on table public.coin_config is 'Singleton config for coin economy. Default: RM1=10 coins, author cut 70%.';
comment on function public.spend_coins_for_unlock(uuid, uuid) is 'Atomic coin spend + unlock insert. Caller must hold Redis per-user lock.';
