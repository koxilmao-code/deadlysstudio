
CREATE POLICY "Anyone authenticated can insert team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);
