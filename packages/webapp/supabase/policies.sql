-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.writings enable row level security;
alter table public.chapters enable row level security;
alter table public.library enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.coins enable row level security;
alter table public.transactions enable row level security;
alter table public.reading_history enable row level security;
alter table public.analytics enable row level security;

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can update their own profile" 
  on public.profiles for update using (auth.uid() = id);

-- WALLETS POLICIES
create policy "Users can view their own wallet" 
  on public.wallets for select using (auth.uid() = user_id);

create policy "Admins have full access to wallets" 
  on public.wallets for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- WRITINGS POLICIES
create policy "Anyone can view published writings" 
  on public.writings for select using (status = 'published');

create policy "Authors can view their own writings" 
  on public.writings for select using (auth.uid() = author_id);

create policy "Authors can insert writings" 
  on public.writings for insert with check (
    auth.uid() = author_id and 
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and (profiles.role = 'author' or profiles.role = 'admin')
    )
  );

create policy "Authors can update their own writings" 
  on public.writings for update using (auth.uid() = author_id);

create policy "Authors can delete their own writings" 
  on public.writings for delete using (auth.uid() = author_id);

create policy "Admins have full access to writings" 
  on public.writings for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- CHAPTERS POLICIES
create policy "Anyone can view published chapters" 
  on public.chapters for select using (status = 'published');

create policy "Authors can view chapters of their writings" 
  on public.chapters for select using (
    exists (
      select 1 from public.writings 
      where writings.id = writing_id and writings.author_id = auth.uid()
    )
  );

create policy "Authors can insert chapters" 
  on public.chapters for insert with check (
    exists (
      select 1 from public.writings 
      where writings.id = writing_id and writings.author_id = auth.uid()
    )
  );

create policy "Authors can update chapters" 
  on public.chapters for update using (
    exists (
      select 1 from public.writings 
      where writings.id = writing_id and writings.author_id = auth.uid()
    )
  );

create policy "Authors can delete chapters" 
  on public.chapters for delete using (
    exists (
      select 1 from public.writings 
      where writings.id = writing_id and writings.author_id = auth.uid()
    )
  );

create policy "Admins have full access to chapters" 
  on public.chapters for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- LIBRARY POLICIES
create policy "Users can view their own library" 
  on public.library for select using (auth.uid() = user_id);

create policy "Users can add to their library" 
  on public.library for insert with check (auth.uid() = user_id);

create policy "Users can remove from library" 
  on public.library for delete using (auth.uid() = user_id);

-- LIKES POLICIES
create policy "Anyone can view likes" 
  on public.likes for select using (true);

create policy "Users can add likes" 
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can delete likes" 
  on public.likes for delete using (auth.uid() = user_id);

-- COMMENTS POLICIES
create policy "Anyone can view comments" 
  on public.comments for select using (true);

create policy "Users can add comments" 
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update comments" 
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete comments" 
  on public.comments for delete using (auth.uid() = user_id);

create policy "Authors/Admins can moderate comments" 
  on public.comments for delete using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    ) or exists (
      select 1 from public.writings 
      where writings.id = writing_id and writings.author_id = auth.uid()
    )
  );

-- SUBSCRIPTIONS POLICIES
create policy "Users can view their own subscriptions" 
  on public.subscriptions for select using (auth.uid() = user_id);

create policy "Admins can manage subscriptions" 
  on public.subscriptions for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- COINS POLICIES
create policy "Anyone can view active coin options" 
  on public.coins for select using (is_active = true);

create policy "Admins can manage coin packages" 
  on public.coins for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- TRANSACTIONS POLICIES
create policy "Users can view their own transactions" 
  on public.transactions for select using (
    exists (
      select 1 from public.wallets 
      where wallets.id = wallet_id and wallets.user_id = auth.uid()
    )
  );

create policy "Admins can view all transactions" 
  on public.transactions for select using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- READING HISTORY POLICIES
create policy "Users can view their reading history" 
  on public.reading_history for select using (auth.uid() = user_id);

create policy "Users can insert reading history" 
  on public.reading_history for insert with check (auth.uid() = user_id);

create policy "Users can update reading history" 
  on public.reading_history for update using (auth.uid() = user_id);

-- ANALYTICS POLICIES
create policy "Anyone can log analytics events" 
  on public.analytics for insert with check (true);

create policy "Admins can view all analytics" 
  on public.analytics for select using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Authors can view analytics for their writings" 
  on public.analytics for select using (
    exists (
      select 1 from public.writings 
      where writings.id = writing_id and writings.author_id = auth.uid()
    )
  );

-- REPORTS POLICIES
alter table public.reports enable row level security;

create policy "Admins have full access to reports" 
  on public.reports for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Authenticated users can submit reports" 
  on public.reports for insert with check (
    auth.uid() = reporter_id
  );

create policy "Users can view their own submitted reports" 
  on public.reports for select using (
    auth.uid() = reporter_id
  );

