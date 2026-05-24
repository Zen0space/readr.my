-- Per-author daily earnings rollup. Refreshed by a BullMQ job (idempotent).
-- v0: coin revenue only. Subscription revenue rollup wired up alongside B0.5 payments.
create materialized view public.author_earnings_daily as
with coin_rate as (
  select coins_per_rm from public.coin_config where id = 1
)
select
  s.author_id,
  (date_trunc('day', u.unlocked_at at time zone 'Asia/Kuala_Lumpur'))::date as day,
  'coin'::text as source,
  sum(u.coins_paid)::bigint as gross_coins,
  sum(u.author_cut_coins)::bigint as author_cut_coins,
  ((sum(u.author_cut_coins)::numeric * 100)
     / nullif((select coins_per_rm from coin_rate), 0))::bigint as author_cut_rm_cents
from public.chapter_unlocks u
join public.chapters c on c.id = u.chapter_id
join public.stories s on s.id = c.story_id
group by s.author_id, day
with no data;

create unique index author_earnings_daily_key
  on public.author_earnings_daily (author_id, day, source);

create or replace function public.refresh_author_earnings_daily() returns void
  language plpgsql security definer set search_path = public as $$
begin
  refresh materialized view concurrently public.author_earnings_daily;
end $$;

comment on materialized view public.author_earnings_daily is 'Daily per-author earnings rollup. Refresh via refresh_author_earnings_daily() from BullMQ. v0: coin revenue only; subscription revenue lands with B0.5.';
