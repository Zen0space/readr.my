-- Storage bucket for story cover images.
-- Public-read so cover_url can be a plain CDN URL with no signing on the read path.
-- Writes are gated by the backend signed-upload-URL flow (/v1/me/cover-upload-url).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  5 * 1024 * 1024, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Owners can read/update/delete their own uploads (path layout: <author_id>/<file>).
-- Anonymous reads are allowed by the bucket's public flag.
create policy "covers_owner_read"
  on storage.objects for select
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "covers_owner_update"
  on storage.objects for update
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "covers_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);
