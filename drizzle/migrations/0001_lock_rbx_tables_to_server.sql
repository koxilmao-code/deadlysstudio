DROP POLICY IF EXISTS "public read snapshots" ON public.rbx_snapshots;
DROP POLICY IF EXISTS "public read universes" ON public.rbx_universes;
REVOKE ALL ON public.rbx_snapshots FROM anon, authenticated;
REVOKE ALL ON public.rbx_universes FROM anon, authenticated;
GRANT ALL ON public.rbx_snapshots TO service_role;
GRANT ALL ON public.rbx_universes TO service_role;
ALTER TABLE public.rbx_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbx_universes ENABLE ROW LEVEL SECURITY;