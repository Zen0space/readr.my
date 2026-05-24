-- Make refresh_author_earnings_daily() self-healing.
-- Background: 0005 creates the MV `with no data`. REFRESH MATERIALIZED VIEW
-- CONCURRENTLY requires at least one prior non-concurrent refresh to populate
-- the view; otherwise Postgres errors with 0A000 "CONCURRENTLY cannot be used
-- when the materialized view is not populated". The worker hit this on its
-- first run. Solution: check pg_class.relispopulated and pick the right form.

create or replace function public.refresh_author_earnings_daily() returns void
  language plpgsql security definer set search_path = public as $$
declare
  is_populated boolean;
begin
  select c.relispopulated
    into is_populated
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'author_earnings_daily';

  if coalesce(is_populated, false) then
    refresh materialized view concurrently public.author_earnings_daily;
  else
    -- First call (or post-truncate). Non-concurrent populate; takes a brief
    -- AccessExclusiveLock but the view is empty/small so impact is negligible.
    refresh materialized view public.author_earnings_daily;
  end if;
end $$;
