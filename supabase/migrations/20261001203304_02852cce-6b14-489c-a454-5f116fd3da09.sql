-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','staff','user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Creator',
  avatar_url text,
  bio text,
  services text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles visible" ON public.profiles FOR SELECT TO anon, authenticated
  USING (is_public OR id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUBSCRIPTIONS (written only by server)
CREATE TYPE public.plan_tier AS ENUM ('free','starter','premium','enterprise');
CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY,
  tier plan_tier NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  current_period_end timestamptz NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subscription read" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Effective tier (expired paid plans fall back to free); billing window rolls monthly
CREATE OR REPLACE FUNCTION public.effective_tier(_uid uuid)
RETURNS plan_tier LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT CASE WHEN status IN ('active','trialing') AND (tier = 'free' OR tier = 'enterprise' OR current_period_end > now()) THEN tier ELSE 'free'::plan_tier END
    FROM public.subscriptions WHERE user_id = _uid), 'free'::plan_tier)
$$;
CREATE OR REPLACE FUNCTION public.tier_rank(_t plan_tier)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _t WHEN 'free' THEN 0 WHEN 'starter' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END
$$;
CREATE OR REPLACE FUNCTION public.has_tier(_uid uuid, _min plan_tier)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tier_rank(public.effective_tier(_uid)) >= public.tier_rank(_min)
$$;
-- Current credit window: Stripe period when present, else calendar month
CREATE OR REPLACE FUNCTION public.credit_window_start(_uid uuid)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT CASE WHEN current_period_end > now() AND current_period_start <= now() THEN current_period_start END
    FROM public.subscriptions WHERE user_id = _uid), date_trunc('month', now()))
$$;

-- New user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- GAMES (platform-agnostic)
CREATE TYPE public.game_platform AS ENUM ('roblox','uefn');
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  platform game_platform NOT NULL DEFAULT 'roblox',
  external_game_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text CHECK (char_length(description) <= 2000),
  thumbnail_url text,
  genre text NOT NULL DEFAULT 'other',
  is_public boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_game_id, creator_id)
);
GRANT SELECT ON public.games TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public or own games" ON public.games FOR SELECT TO anon, authenticated
  USING (is_public OR creator_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own games insert" ON public.games FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Own games update" ON public.games FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Own games delete" ON public.games FOR DELETE TO authenticated USING (creator_id = auth.uid());
CREATE TRIGGER games_updated BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- METRIC SNAPSHOTS (written only by trusted platform adapters)
CREATE TABLE public.game_metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  visits bigint, ccu integer, favorites bigint, likes bigint, dislikes bigint,
  new_players integer, returning_players integer, avg_session_seconds integer,
  d1_retention numeric, d7_retention numeric, d30_retention numeric,
  revenue numeric, purchases integer, paying_users integer,
  is_public_metric boolean NOT NULL DEFAULT true
);
CREATE INDEX ON public.game_metric_snapshots (game_id, captured_at DESC);
GRANT SELECT ON public.game_metric_snapshots TO anon, authenticated;
GRANT ALL ON public.game_metric_snapshots TO service_role;
ALTER TABLE public.game_metric_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metric visibility" ON public.game_metric_snapshots FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND (g.creator_id = auth.uid() OR public.is_staff(auth.uid()) OR (g.is_public AND is_public_metric))));

-- Private metric columns are hidden from non-owners via this view
CREATE OR REPLACE VIEW public.public_game_metrics WITH (security_invoker = true) AS
  SELECT s.game_id, s.captured_at, s.visits, s.ccu, s.favorites, s.likes, s.dislikes
  FROM public.game_metric_snapshots s;
GRANT SELECT ON public.public_game_metrics TO anon, authenticated;

-- MARKETPLACE
CREATE TYPE public.platform_compat AS ENUM ('roblox','uefn','multi');
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  category text NOT NULL CHECK (category IN ('games','assets','ui','vfx','sfx','scripts','plugins','dev-services','creative-services')),
  compatibility platform_compat NOT NULL DEFAULT 'roblox',
  price_usd numeric NOT NULL DEFAULT 0 CHECK (price_usd >= 0 AND price_usd <= 1000000),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  image_url text,
  contact_url text,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active listings public" ON public.marketplace_listings FOR SELECT TO anon, authenticated
  USING (is_active OR seller_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own listing insert" ON public.marketplace_listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid() AND (game_id IS NULL OR EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.creator_id = auth.uid())));
CREATE POLICY "Own listing update" ON public.marketplace_listings FOR UPDATE TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid() AND (game_id IS NULL OR EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.creator_id = auth.uid())));
CREATE POLICY "Own listing delete" ON public.marketplace_listings FOR DELETE TO authenticated USING (seller_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER listings_updated BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CREATIVE REQUESTS
CREATE TYPE public.creative_kind AS ENUM ('thumbnail','trailer');
CREATE TYPE public.creative_status AS ENUM ('submitted','reviewing','in_progress','awaiting_info','ready_for_review','revision_requested','completed');
CREATE SEQUENCE public.creative_request_number START 1001;
CREATE TABLE public.creative_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number integer NOT NULL UNIQUE DEFAULT nextval('public.creative_request_number'),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  kind creative_kind NOT NULL,
  status creative_status NOT NULL DEFAULT 'submitted',
  tier_at_submit plan_tier NOT NULL,
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferred_date date,
  expected_delivery date,
  assigned_to uuid,
  deliverable_url text,
  staff_message text,
  revision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creative_requests TO authenticated;
GRANT UPDATE ON public.creative_requests TO authenticated;
GRANT ALL ON public.creative_requests TO service_role;
ALTER TABLE public.creative_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or staff requests" ON public.creative_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage requests" ON public.creative_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER creative_updated BEFORE UPDATE ON public.creative_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.creative_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.creative_requests(id) ON DELETE CASCADE,
  actor_id uuid,
  status creative_status,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creative_request_events TO authenticated;
GRANT ALL ON public.creative_request_events TO service_role;
ALTER TABLE public.creative_request_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event visibility" ON public.creative_request_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creative_requests r WHERE r.id = request_id AND (r.user_id = auth.uid() OR public.is_staff(auth.uid()))));

CREATE OR REPLACE FUNCTION public.log_creative_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.creative_request_events (request_id, actor_id, status, message)
    VALUES (NEW.id, auth.uid(), NEW.status, CASE WHEN NEW.status = 'revision_requested' THEN NEW.revision_note ELSE NEW.staff_message END);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creative_log AFTER INSERT OR UPDATE ON public.creative_requests FOR EACH ROW EXECUTE FUNCTION public.log_creative_change();

CREATE OR REPLACE FUNCTION public.credit_allowance(_tier plan_tier, _kind creative_kind)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _kind = 'thumbnail' THEN CASE _tier WHEN 'starter' THEN 2 WHEN 'premium' THEN 4 WHEN 'enterprise' THEN 8 ELSE 0 END
    ELSE CASE _tier WHEN 'enterprise' THEN 2 ELSE 0 END END
$$;

CREATE OR REPLACE FUNCTION public.get_credit_usage()
RETURNS TABLE (kind creative_kind, used int, allowance int, window_start timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT k.kind,
    (SELECT count(*)::int FROM public.creative_requests r WHERE r.user_id = auth.uid() AND r.kind = k.kind AND r.created_at >= public.credit_window_start(auth.uid())),
    public.credit_allowance(public.effective_tier(auth.uid()), k.kind),
    public.credit_window_start(auth.uid())
  FROM (VALUES ('thumbnail'::creative_kind), ('trailer'::creative_kind)) AS k(kind)
  WHERE auth.uid() IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.submit_creative_request(_game_id uuid, _kind creative_kind, _brief jsonb, _preferred_date date)
RETURNS public.creative_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _tier plan_tier; _used int; _row public.creative_requests;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.games WHERE id = _game_id AND creator_id = _uid) THEN RAISE EXCEPTION 'You can only request assets for your own games'; END IF;
  IF jsonb_typeof(_brief) <> 'object' OR length(_brief::text) > 20000 THEN RAISE EXCEPTION 'Invalid brief'; END IF;
  _tier := public.effective_tier(_uid);
  PERFORM pg_advisory_xact_lock(hashtext(_uid::text || _kind::text));
  SELECT count(*) INTO _used FROM public.creative_requests WHERE user_id = _uid AND kind = _kind AND created_at >= public.credit_window_start(_uid);
  IF _used >= public.credit_allowance(_tier, _kind) THEN
    RAISE EXCEPTION 'No % credits remaining on your % plan', _kind, _tier;
  END IF;
  INSERT INTO public.creative_requests (user_id, game_id, kind, tier_at_submit, brief, preferred_date)
  VALUES (_uid, _game_id, _kind, _tier, _brief, _preferred_date) RETURNING * INTO _row;
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.request_creative_revision(_request_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF char_length(coalesce(_note,'')) NOT BETWEEN 5 AND 2000 THEN RAISE EXCEPTION 'Describe the revision (5-2000 chars)'; END IF;
  UPDATE public.creative_requests SET status = 'revision_requested', revision_note = _note
  WHERE id = _request_id AND user_id = auth.uid() AND status IN ('ready_for_review','completed');
  IF NOT FOUND THEN RAISE EXCEPTION 'Revision not available for this request'; END IF;
END $$;

-- A/B TESTS
CREATE TYPE public.ab_asset AS ENUM ('thumbnail','icon','title','promo','trailer');
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_number integer GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  asset_type ab_asset NOT NULL DEFAULT 'thumbnail',
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  variant_a text NOT NULL, variant_b text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','ended')),
  impressions_a bigint NOT NULL DEFAULT 0, impressions_b bigint NOT NULL DEFAULT 0,
  clicks_a bigint NOT NULL DEFAULT 0, clicks_b bigint NOT NULL DEFAULT 0,
  engaged_a bigint NOT NULL DEFAULT 0, engaged_b bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ab_tests TO authenticated;
GRANT UPDATE (name, status, variant_a, variant_b) ON public.ab_tests TO authenticated;
GRANT ALL ON public.ab_tests TO service_role;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tests read" ON public.ab_tests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Starter+ create tests" ON public.ab_tests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_tier(auth.uid(),'starter') AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.creator_id = auth.uid())
    AND impressions_a = 0 AND impressions_b = 0 AND clicks_a = 0 AND clicks_b = 0 AND engaged_a = 0 AND engaged_b = 0);
CREATE POLICY "Own tests update" ON public.ab_tests FOR UPDATE TO authenticated USING (user_id = auth.uid() AND public.has_tier(auth.uid(),'starter')) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own tests delete" ON public.ab_tests FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER ab_updated BEFORE UPDATE ON public.ab_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STAFF-ONLY INTERNAL TOOLS
DROP POLICY IF EXISTS "Anyone authenticated can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone authenticated can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone authenticated can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone authenticated can view tasks" ON public.tasks;
CREATE POLICY "Staff manage tasks" ON public.tasks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can manage wiki" ON public.wiki_pages;
CREATE POLICY "Staff manage wiki" ON public.wiki_pages FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can manage notes" ON public.task_notes;
CREATE POLICY "Staff manage notes" ON public.task_notes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can manage dependencies" ON public.task_dependencies;
CREATE POLICY "Staff manage deps" ON public.task_dependencies FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can insert change logs" ON public.change_logs;
DROP POLICY IF EXISTS "Authenticated users can view change logs" ON public.change_logs;
CREATE POLICY "Staff insert logs" ON public.change_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff view logs" ON public.change_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can insert unique team members" ON public.team_members;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;
CREATE POLICY "Staff view team" ON public.team_members FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff link self" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Staff read submissions" ON public.game_review_submissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff read applications" ON public.job_applications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Backfill existing accounts
INSERT INTO public.profiles (id, display_name) SELECT id, split_part(coalesce(email,'creator'),'@',1) FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.subscriptions (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role) SELECT id, 'user' FROM auth.users ON CONFLICT DO NOTHING;