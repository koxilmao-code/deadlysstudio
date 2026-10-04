CREATE OR REPLACE FUNCTION public.credit_allowance(_tier plan_tier, _kind creative_kind)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _kind = 'thumbnail' THEN CASE _tier WHEN 'starter' THEN 2 WHEN 'premium' THEN 4 WHEN 'enterprise' THEN 6 ELSE 0 END
    ELSE CASE _tier WHEN 'enterprise' THEN 2 ELSE 0 END END
$$;

CREATE TABLE public.rbx_universes (
  universe_id bigint PRIMARY KEY,
  root_place_id bigint,
  name text NOT NULL,
  creator_name text,
  icon_url text,
  thumb_url text,
  genre text,
  created_at_rbx timestamptz,
  updated_at_rbx timestamptz,
  max_players int,
  price int,
  last_polled timestamptz NOT NULL DEFAULT now(),
  first_seen timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbx_universes TO anon, authenticated;
GRANT ALL ON public.rbx_universes TO service_role;
ALTER TABLE public.rbx_universes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read universes" ON public.rbx_universes FOR SELECT USING (true);

CREATE TABLE public.rbx_snapshots (
  id bigserial PRIMARY KEY,
  universe_id bigint NOT NULL REFERENCES public.rbx_universes(universe_id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  playing int NOT NULL DEFAULT 0,
  visits bigint NOT NULL DEFAULT 0,
  favorites bigint NOT NULL DEFAULT 0,
  up_votes bigint NOT NULL DEFAULT 0,
  down_votes bigint NOT NULL DEFAULT 0
);
CREATE INDEX rbx_snapshots_u_t ON public.rbx_snapshots (universe_id, captured_at DESC);
GRANT SELECT ON public.rbx_snapshots TO anon, authenticated;
GRANT ALL ON public.rbx_snapshots TO service_role;
GRANT USAGE ON SEQUENCE public.rbx_snapshots_id_seq TO service_role;
ALTER TABLE public.rbx_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read snapshots" ON public.rbx_snapshots FOR SELECT USING (true);