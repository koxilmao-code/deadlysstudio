CREATE TABLE public.internal_job_keys (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.internal_job_keys FROM anon, authenticated;
GRANT ALL ON public.internal_job_keys TO service_role;
ALTER TABLE public.internal_job_keys ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_job_keys (name) VALUES ('rbx-poll') ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public can submit game reviews" ON public.game_review_submissions;
CREATE POLICY "Public can submit game reviews" ON public.game_review_submissions
FOR INSERT TO anon, authenticated
WITH CHECK (
  created_at BETWEEN now() - interval '2 minutes' AND now() + interval '2 minutes'
  AND char_length(btrim(studio_name)) BETWEEN 2 AND 100
  AND game_stage IN ('concept','alpha','beta','live')
  AND primary_goal IN ('retention','monetization','acquisition','live-ops','overall-strategy')
);

DROP POLICY IF EXISTS "Public can submit job applications" ON public.job_applications;
CREATE POLICY "Public can submit job applications" ON public.job_applications
FOR INSERT TO anon, authenticated
WITH CHECK (
  created_at BETWEEN now() - interval '2 minutes' AND now() + interval '2 minutes'
  AND role_slug IN ('acquisition-executive','live-operations')
  AND char_length(btrim(note)) BETWEEN 20 AND 2000
);