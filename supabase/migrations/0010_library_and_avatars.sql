-- Library / bookshelf: a reader's saved stories.
-- Distinct from `follows` (which tracks authors). Library rows are user → story.
create table public.library (
  user_id uuid not null references public.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, story_id)
);
create index library_user_recent_idx on public.library (user_id, added_at desc);

alter table public.library enable row level security;

-- Owner-only writes; reads are owner-only too (your bookshelf is private).
create policy library_owner_all on public.library
  for all to authenticated
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid() and public.is_active());

-- Storage bucket for user avatar uploads. Public-read so cover/avatar URLs
-- are CDN-friendly. Writes are gated by the backend signed-upload-URL flow
-- (/v1/me/avatar-upload-url). Path layout: <user_id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_owner_read"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_owner_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

comment on table public.library is 'Reader bookshelves — user → story saves.';