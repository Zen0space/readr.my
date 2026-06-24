-- Honour signup metadata `role` (set by clients like the desktop author app).
-- Defaults remain 'reader' for the public webapp signup path.

create or replace function public.handle_new_auth_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  meta_role text;
  resolved_role public.user_role;
begin
  meta_role := nullif(new.raw_user_meta_data->>'role', '');
  if meta_role in ('reader', 'author') then
    resolved_role := meta_role::public.user_role;
  else
    resolved_role := 'reader';
  end if;

  insert into public.users (id, role, display_name, email_lower)
  values (
    new.id,
    resolved_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do nothing;
  return new;
end $$;
