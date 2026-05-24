create type public.payout_status as enum ('requested', 'approved', 'paid', 'rejected');
create type public.report_target_kind as enum ('story', 'chapter', 'user');
create type public.report_status as enum ('open', 'dismissed', 'actioned');
create type public.notification_kind as enum ('chapter_published', 'payout_state_changed');

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  amount_coins bigint not null check (amount_coins > 0),
  amount_rm_cents int not null check (amount_rm_cents > 0),
  status public.payout_status not null default 'requested',
  method_ref text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  rejected_at timestamptz,
  reviewer_id uuid references public.users(id),
  notes text,
  rejection_reason text,
  constraint payouts_state_timestamps check (
    (status = 'requested' and approved_at is null and paid_at is null and rejected_at is null) or
    (status = 'approved'  and approved_at is not null and paid_at is null and rejected_at is null) or
    (status = 'paid'      and approved_at is not null and paid_at is not null and rejected_at is null) or
    (status = 'rejected'  and rejected_at is not null and paid_at is null)
  )
);
create index payouts_author_idx on public.payouts (author_id, requested_at desc);
create index payouts_queue_idx on public.payouts (requested_at) where status in ('requested', 'approved');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_kind public.report_target_kind not null,
  target_id uuid not null,
  reason text not null check (length(reason) between 1 and 60),
  free_text text check (length(free_text) <= 2000),
  status public.report_status not null default 'open',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_open_idx on public.reports (created_at desc) where status = 'open';
create index reports_target_idx on public.reports (target_kind, target_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind public.notification_kind not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_user_recent_idx on public.notifications (user_id, created_at desc);

-- Fan-out: when a chapter publishes, notify every follower of its author.
create or replace function public.fanout_chapter_published() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_author_id uuid;
begin
  if new.published_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.published_at is not null then
    return new;  -- already published earlier
  end if;
  select author_id into v_author_id from public.stories where id = new.story_id;

  insert into public.notifications (user_id, kind, payload)
  select f.follower_id,
         'chapter_published',
         jsonb_build_object('story_id', new.story_id, 'chapter_id', new.id, 'author_id', v_author_id)
  from public.follows f
  where f.author_id = v_author_id;

  return new;
end $$;

create trigger chapters_fanout_published_insert
  after insert on public.chapters
  for each row execute function public.fanout_chapter_published();

create trigger chapters_fanout_published_update
  after update of published_at on public.chapters
  for each row when (new.published_at is not null and old.published_at is null)
  execute function public.fanout_chapter_published();

-- Notify author on payout state changes.
create or replace function public.notify_payout_state_change() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status = old.status then
    return new;
  end if;
  insert into public.notifications (user_id, kind, payload)
  values (
    new.author_id,
    'payout_state_changed',
    jsonb_build_object('payout_id', new.id, 'status', new.status, 'amount_rm_cents', new.amount_rm_cents)
  );
  return new;
end $$;

create trigger payouts_notify_state_insert
  after insert on public.payouts
  for each row execute function public.notify_payout_state_change();

create trigger payouts_notify_state_update
  after update of status on public.payouts
  for each row execute function public.notify_payout_state_change();

-- RLS
alter table public.payouts enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy payouts_author_read on public.payouts
  for select to authenticated using (author_id = auth.uid());
create policy payouts_author_request on public.payouts
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_active() and status = 'requested');
create policy payouts_admin_all on public.payouts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy reports_author_insert on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_active());
create policy reports_reporter_read on public.reports
  for select to authenticated using (reporter_id = auth.uid());
create policy reports_admin_all on public.reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy notifications_owner_read on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy notifications_admin_read on public.notifications
  for select to authenticated using (public.is_admin());

comment on table public.payouts is 'Author payout requests. State machine: requested -> approved -> paid OR requested -> rejected.';
comment on table public.reports is 'User-submitted reports against stories/chapters/users; moderated by admin.';
comment on table public.notifications is 'In-app notifications; consumed via Supabase Realtime channel.';
