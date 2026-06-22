-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('admin', 'author', 'reader')) default 'reader',
  username text unique,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WALLETS
create table public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  coin_balance integer default 0 not null check (coin_balance >= 0),
  earnings_balance numeric(10, 2) default 0.00 not null check (earnings_balance >= 0.00),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WRITINGS (Books)
create table public.writings (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cover_url text,
  status text check (status in ('draft', 'published')) default 'draft' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHAPTERS
create table public.chapters (
  id uuid default gen_random_uuid() primary key,
  writing_id uuid references public.writings(id) on delete cascade not null,
  title text not null,
  content text not null,
  chapter_order integer not null,
  is_premium boolean default false not null,
  coin_price integer default 0 not null check (coin_price >= 0),
  status text check (status in ('draft', 'published')) default 'draft' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (writing_id, chapter_order)
);

-- LIBRARY
create table public.library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  writing_id uuid references public.writings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, writing_id)
);

-- LIKES
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  writing_id uuid references public.writings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, writing_id)
);

-- COMMENTS
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  writing_id uuid references public.writings(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tier text check (tier in ('premium_reader', 'vip_reader')) default 'premium_reader' not null,
  status text check (status in ('active', 'expired', 'cancelled')) default 'active' not null,
  starts_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ends_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COINS (Coin purchase packs config)
create table public.coins (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  coins_amount integer not null check (coins_amount > 0),
  price_usd numeric(10, 2) not null check (price_usd >= 0.00),
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  type text check (type in ('coin_purchase', 'chapter_unlock', 'subscription_purchase', 'earnings_payout', 'earnings_credit')) not null,
  amount_coins integer default 0 not null,
  amount_currency numeric(10, 2) default 0.00 not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- READING HISTORY
create table public.reading_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  writing_id uuid references public.writings(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  scroll_position numeric default 0.00 not null check (scroll_position >= 0.00),
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, writing_id)
);

-- ANALYTICS
create table public.analytics (
  id uuid default gen_random_uuid() primary key,
  event_type text not null check (event_type in ('view_writing', 'read_chapter', 'purchase_coins', 'unlock_chapter')),
  user_id uuid references public.profiles(id) on delete set null,
  writing_id uuid references public.writings(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for optimization
create index idx_writings_author on public.writings(author_id);
create index idx_writings_status on public.writings(status);
create index idx_chapters_writing on public.chapters(writing_id);
create index idx_chapters_order on public.chapters(writing_id, chapter_order);
create index idx_library_user on public.library(user_id);
create index idx_reading_history_user on public.reading_history(user_id);
create index idx_transactions_wallet on public.transactions(wallet_id);
create index idx_comments_chapter on public.comments(chapter_id);
create index idx_analytics_writing on public.analytics(writing_id);
create index idx_analytics_event on public.analytics(event_type);

-- Triggers for profiles and wallets automatic creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'reader')
  );
  
  insert into public.wallets (user_id, coin_balance, earnings_balance)
  values (new.id, 0, 0.00);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ATOMIC UNLOCK CHAPTER FUNCTION
create or replace function public.unlock_chapter(
  p_user_id uuid,
  p_chapter_id uuid,
  p_coin_rate numeric
) returns jsonb as $$
declare
  v_chapter_price integer;
  v_writing_author_id uuid;
  v_reader_wallet_id uuid;
  v_author_wallet_id uuid;
  v_reader_balance integer;
  v_earnings_credit numeric(10, 2);
begin
  -- 1. Get chapter details
  select c.coin_price, w.author_id
  into v_chapter_price, v_writing_author_id
  from public.chapters c
  join public.writings w on w.id = c.writing_id
  where c.id = p_chapter_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Chapter not found');
  end if;
  
  if v_chapter_price = 0 then
    return jsonb_build_object('success', true, 'message', 'Chapter is free');
  end if;

  -- 2. Get reader wallet
  select id, coin_balance 
  into v_reader_wallet_id, v_reader_balance
  from public.wallets 
  where user_id = p_user_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Reader wallet not found');
  end if;
  
  -- 3. Verify coin balance
  if v_reader_balance < v_chapter_price then
    return jsonb_build_object('success', false, 'error', 'Insufficient coins');
  end if;
  
  -- 4. Get author wallet
  select id 
  into v_author_wallet_id
  from public.wallets 
  where user_id = v_writing_author_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Author wallet not found');
  end if;

  -- Prevent authors self-unlocking charging themselves
  if p_user_id = v_writing_author_id then
    return jsonb_build_object('success', false, 'error', 'Author cannot unlock their own chapter');
  end if;

  -- 5. Deduct reader coins
  update public.wallets 
  set coin_balance = coin_balance - v_chapter_price, updated_at = now()
  where id = v_reader_wallet_id;
  
  -- 6. Credit author earnings
  v_earnings_credit := v_chapter_price * p_coin_rate;
  update public.wallets 
  set earnings_balance = earnings_balance + v_earnings_credit, updated_at = now()
  where id = v_author_wallet_id;
  
  -- 7. Log reader transaction
  insert into public.transactions (wallet_id, type, amount_coins, amount_currency, metadata)
  values (v_reader_wallet_id, 'chapter_unlock', -v_chapter_price, 0.00, jsonb_build_object('chapter_id', p_chapter_id));
  
  -- 8. Log author transaction
  insert into public.transactions (wallet_id, type, amount_coins, amount_currency, metadata)
  values (v_author_wallet_id, 'earnings_credit', 0, v_earnings_credit, jsonb_build_object('chapter_id', p_chapter_id, 'unlocked_by', p_user_id));
  
  -- 9. Log analytics event
  insert into public.analytics (event_type, user_id, chapter_id, metadata)
  values ('unlock_chapter', p_user_id, p_chapter_id, jsonb_build_object('coins_spent', v_chapter_price, 'earnings_credit', v_earnings_credit));

  return jsonb_build_object('success', true, 'coins_spent', v_chapter_price, 'earnings_credit', v_earnings_credit);
end;
$$ language plpgsql security definer;

-- REPORTS (Content Moderation Queue)
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('comment', 'chapter', 'writing')),
  target_id uuid not null,
  reason text not null,
  content_snippet text,
  status text not null check (status in ('pending', 'resolved', 'archived')) default 'pending',
  priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_reports_status on public.reports(status);
create index idx_reports_priority on public.reports(priority);

