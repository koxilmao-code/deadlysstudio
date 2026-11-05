CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin','management','designer','customer_support','staff'));
$$;
CREATE OR REPLACE FUNCTION public.can_manage_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'));
$$;
REVOKE ALL ON FUNCTION public.can_manage_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_team(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.list_team_accounts()
RETURNS TABLE(user_id uuid, display_name text, roles text[]) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_manage_team(auth.uid()) THEN RAISE EXCEPTION 'Team management requires owner or admin access' USING ERRCODE = '42501'; END IF;
 RETURN QUERY SELECT p.id, p.display_name, COALESCE(array_agg(r.role::text) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::text[]) FROM public.profiles p LEFT JOIN public.user_roles r ON r.user_id = p.id GROUP BY p.id, p.display_name ORDER BY p.display_name;
END;
$$;
REVOKE ALL ON FUNCTION public.list_team_accounts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_team_accounts() TO authenticated;
CREATE OR REPLACE FUNCTION public.set_team_role(_user_id uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_owner boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_manage_team(auth.uid()) THEN RAISE EXCEPTION 'Team management requires owner or admin access' USING ERRCODE = '42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('outrun-team-roles'));
 caller_owner := public.has_role(auth.uid(), 'owner');
 IF _role IS NULL OR _role NOT IN ('admin','management','designer','customer_support','user') THEN RAISE EXCEPTION 'Invalid team role' USING ERRCODE = '22023'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN RAISE EXCEPTION 'Account not found' USING ERRCODE = '22023'; END IF;
 IF public.has_role(_user_id, 'owner') THEN RAISE EXCEPTION 'Owner role cannot be changed here' USING ERRCODE = '42501'; END IF;
 IF NOT caller_owner AND (_role = 'admin' OR public.has_role(_user_id, 'admin')) THEN RAISE EXCEPTION 'Only the owner can manage admins' USING ERRCODE = '42501'; END IF;
 DELETE FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','management','designer','customer_support','staff');
 INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role::public.app_role) ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.set_team_role(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_team_role(uuid,text) TO authenticated;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.can_manage_team(auth.uid()));