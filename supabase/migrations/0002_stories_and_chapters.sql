create type public.story_status as enum ('draft', 'ongoing', 'completed');
create type public.chapter_gating as enum ('free', 'coin', 'sub');
create type public.age_rating as enum ('general', 'teen', 'mature');
create type public.language as enum ('ms', 'en');

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  blurb text check (length(blurb) <= 2000),
  cover_url text,
  genre text not null check (length(genre) between 1 and 40),
  tags text[] not null default '{}',
  language public.language not null,
  age_rating public.age_rating not null default 'general',
  status public.story_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stories_author_idx on public.stories (author_id);
create index stories_status_published_idx on public.stories (status, published_at desc) where status <> 'draft';
create index stories_genre_idx on public.stories (genre) where status <> 'draft';
create index stories_language_idx on public.stories (language) where status <> 'draft';
create index stories_tags_gin on public.stories using gin (tags);
create unique index stories_author_title_key on public.stories (author_id, lower(title));

create trigger stories_touch_updated_at
  before update on public.stories
  for each row execute function public.touch_updated_at();

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  ord int not null check (ord >= 1),
  title text not null check (length(title) between 1 and 200),
  content_md text,
  draft_content_md text,
  gating public.chapter_gating not null default 'free',
  price_coins int not null default 0 check (price_coins >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chapters_gating_price_consistent
    check ((gating = 'coin' and price_coins > 0) or (gating <> 'coin' and price_coins = 0))
);
create unique index chapters_story_ord_key on public.chapters (story_id, ord);
create index chapters_story_published_idx on public.chapters (story_id, published_at desc) where published_at is not null;

create trigger chapters_touch_updated_at
  before update on public.chapters
  for each row execute function public.touch_updated_at();

create table public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, author_id),
  constraint follows_no_self check (follower_id <> author_id)
);
create index follows_author_idx on public.follows (author_id);

create table public.reads (
  user_id uuid not null references public.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  scroll_position int not null default 0 check (scroll_position >= 0),
  read_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);
create index reads_user_recent_idx on public.reads (user_id, read_at desc);

-- Per-chapter votes ("heart")
create table public.chapter_votes (
  user_id uuid not null references public.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);
create index chapter_votes_chapter_idx on public.chapter_votes (chapter_id);

-- RLS
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.follows enable row level security;
alter table public.reads enable row level security;
alter table public.chapter_votes enable row level security;

-- Stories: public read for non-draft; author manages own; admin all
create policy stories_public_read on public.stories
  for select to anon, authenticated
  using (status <> 'draft' or author_id = auth.uid() or public.is_admin());
create policy stories_author_write on public.stories
  for all to authenticated
  using (author_id = auth.uid() and public.is_active())
  with check (author_id = auth.uid() and public.is_active());
create policy stories_admin_all on public.stories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Chapters: metadata visible if parent story visible; content_md gating enforced in API layer (RLS allows the row, service layer redacts content_md when locked).
create policy chapters_public_read on public.chapters
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = chapters.story_id
        and (s.status <> 'draft' or s.author_id = auth.uid() or public.is_admin())
    )
  );
create policy chapters_author_write on public.chapters
  for all to authenticated
  using (
    exists (select 1 from public.stories s where s.id = chapters.story_id and s.author_id = auth.uid())
    and public.is_active()
  )
  with check (
    exists (select 1 from public.stories s where s.id = chapters.story_id and s.author_id = auth.uid())
    and public.is_active()
  );
create policy chapters_admin_all on public.chapters
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Follows: public read counts; owner inserts/deletes own row
create policy follows_public_read on public.follows
  for select to anon, authenticated using (true);
create policy follows_owner_write on public.follows
  for insert to authenticated with check (follower_id = auth.uid() and public.is_active());
create policy follows_owner_delete on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- Reads: owner-only
create policy reads_owner_all on public.reads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Votes: owner writes; public read for aggregation
create policy chapter_votes_public_read on public.chapter_votes
  for select to anon, authenticated using (true);
create policy chapter_votes_owner_write on public.chapter_votes
  for insert to authenticated with check (user_id = auth.uid() and public.is_active());
create policy chapter_votes_owner_delete on public.chapter_votes
  for delete to authenticated using (user_id = auth.uid());

comment on column public.chapters.ord is 'Chapter order within story; 1-based.';
comment on column public.chapters.content_md is 'Published content. NULL until first publish.';
comment on column public.chapters.draft_content_md is 'Working draft saved by the editor; diverges from content_md between publishes.';
