REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_creative_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_window_start(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.effective_tier(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_tier(uuid, plan_tier) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_credit_usage() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_creative_request(uuid, creative_kind, jsonb, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_creative_revision(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.effective_tier(uuid), public.has_tier(uuid, plan_tier), public.has_role(uuid, app_role), public.get_credit_usage(), public.submit_creative_request(uuid, creative_kind, jsonb, date), public.request_creative_revision(uuid, text) TO authenticated;
-- staff linking: allow username reuse check to be done safely
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_username_key;