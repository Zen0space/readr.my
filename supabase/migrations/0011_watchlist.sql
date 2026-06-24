-- Watchlist: a reader's "follow this story" list. Distinct from
-- `library` (which is a private "save to read later" shelf) and from
-- `follows` (which is author-level). A watchlist entry is a soft signal
-- of ongoing interest — the reader wants to be notified when new
-- chapters drop, but hasn't necessarily started reading yet.
create table public.watchlist (
  user_id uuid not null references public.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  added_at timestamptz not null default now(),
  notify_on_chapter boolean not null default true,
  primary key (user_id, story_id)
);
create index watchlist_user_recent_idx on public.watchlist (user_id, added_at desc);
create index watchlist_story_idx on public.watchlist (story_id);

alter table public.watchlist enable row level security;

-- Owner-only writes; reads are owner-only too (your watchlist is private).
create policy watchlist_owner_all on public.watchlist
  for all to authenticated
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid() and public.is_active());

comment on table public.watchlist is 'Reader watchlist — user → story follows with per-row notification opt-in.';
comment on column public.watchlist.notify_on_chapter is 'When true, the reader gets a chapter_published notification on each new chapter.';
