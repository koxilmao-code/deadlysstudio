DROP POLICY "Anyone authenticated can insert team members" ON public.team_members;
CREATE POLICY "Authenticated can insert unique team members" ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (NOT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.username = team_members.username));