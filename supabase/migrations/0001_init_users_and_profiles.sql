-- Domain enums (kept in sync with packages/shared/src/domain/enums.ts)
create type public.user_role as enum ('reader', 'author', 'admin');
create type public.user_status as enum ('active', 'suspended');

-- public.users — application-level profile keyed off auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'reader',
  status public.user_status not null default 'active',
  display_name text not null check (length(display_name) between 1 and 80),
  email_lower text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_lower_key on public.users (email_lower);
create index users_role_idx on public.users (role) where role <> 'reader';
create index users_status_idx on public.users (status) where status <> 'active';

create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

-- Auto-create public.users row when an auth user signs up
create or replace function public.handle_new_auth_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, display_name, email_lower)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Helpers used in RLS policies across the rest of the schema
create or replace function public.current_user_role() returns public.user_role
  language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_active() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select status from public.users where id = auth.uid()) = 'active', false)
$$;

-- author_profiles
create table public.author_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  pen_name text not null check (length(pen_name) between 1 and 80),
  bio text check (length(bio) <= 2000),
  links jsonb not null default '[]'::jsonb,
  payout_method_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index author_profiles_pen_name_key on public.author_profiles (lower(pen_name));

create trigger author_profiles_touch_updated_at
  before update on public.author_profiles
  for each row execute function public.touch_updated_at();

-- reader_profiles
create table public.reader_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  reading_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reader_profiles_touch_updated_at
  before update on public.reader_profiles
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.author_profiles enable row level security;
alter table public.reader_profiles enable row level security;

create policy users_select_authenticated on public.users
  for select to authenticated using (true);
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));
create policy users_admin_all on public.users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy author_profiles_public_read on public.author_profiles
  for select to anon, authenticated using (true);
create policy author_profiles_owner_write on public.author_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy author_profiles_admin_all on public.author_profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy reader_profiles_owner_all on public.reader_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy reader_profiles_admin_read on public.reader_profiles
  for select to authenticated using (public.is_admin());

comment on table public.users is 'Application-level user profile; mirrors auth.users 1:1.';
comment on table public.author_profiles is 'Author-specific profile data; pen_name is shown publicly.';
comment on table public.reader_profiles is 'Reader-specific preferences. Private to owner.';
