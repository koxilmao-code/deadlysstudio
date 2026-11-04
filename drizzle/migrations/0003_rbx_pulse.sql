create or replace function public.rbx_pulse()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with latest as (
  select distinct on (universe_id) universe_id, playing
  from rbx_snapshots where captured_at > now() - interval '30 minutes'
  order by universe_id, captured_at desc
), prior as (
  select distinct on (universe_id) universe_id, playing
  from rbx_snapshots where captured_at between now() - interval '25 hours' and now() - interval '23 hours'
  order by universe_id, captured_at desc
), hourly as (
  select h, sum(p)::bigint as total from (
    select date_trunc('hour', captured_at) as h, universe_id, avg(playing) as p
    from rbx_snapshots where captured_at > now() - interval '24 hours'
    group by 1, 2
  ) x group by h
)
select jsonb_build_object(
  'games', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.universe_id, 'name', u.name, 'creator', u.creator_name, 'icon', u.icon_url,
      'genre', u.genre, 'created', u.created_at_rbx, 'playing', l.playing, 'prior', p.playing
    ) order by l.playing desc)
    from latest l join rbx_universes u using (universe_id) left join prior p using (universe_id)
  ), '[]'::jsonb),
  'series', coalesce((select jsonb_agg(jsonb_build_object('t', h, 'v', total) order by h) from hourly), '[]'::jsonb),
  'at', now()
);
$$;

revoke all on function public.rbx_pulse() from public, anon, authenticated;
grant execute on function public.rbx_pulse() to service_role;