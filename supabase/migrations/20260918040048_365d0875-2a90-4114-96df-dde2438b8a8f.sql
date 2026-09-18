CREATE TABLE public.game_review_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_name text NOT NULL CHECK (char_length(btrim(studio_name)) BETWEEN 2 AND 100),
  contact_email text NOT NULL CHECK (char_length(btrim(contact_email)) BETWEEN 5 AND 254 AND contact_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  game_url text NOT NULL CHECK (char_length(btrim(game_url)) <= 500 AND game_url ~* '^https://(www\.)?roblox\.com/games/[0-9]+'),
  game_stage text NOT NULL CHECK (game_stage IN ('concept', 'alpha', 'beta', 'live')),
  primary_goal text NOT NULL CHECK (primary_goal IN ('retention', 'monetization', 'acquisition', 'live-ops', 'overall-strategy')),
  context text CHECK (context IS NULL OR char_length(btrim(context)) <= 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT INSERT ON public.game_review_submissions TO anon, authenticated;
GRANT ALL ON public.game_review_submissions TO service_role;
ALTER TABLE public.game_review_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit game reviews"
ON public.game_review_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_slug text NOT NULL CHECK (role_slug IN ('acquisition-executive', 'live-operations')),
  applicant_name text NOT NULL CHECK (char_length(btrim(applicant_name)) BETWEEN 2 AND 100),
  contact_email text NOT NULL CHECK (char_length(btrim(contact_email)) BETWEEN 5 AND 254 AND contact_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  profile_url text NOT NULL CHECK (char_length(btrim(profile_url)) BETWEEN 10 AND 500 AND profile_url ~* '^https://'),
  note text NOT NULL CHECK (char_length(btrim(note)) BETWEEN 20 AND 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT INSERT ON public.job_applications TO anon, authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit job applications"
ON public.job_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);