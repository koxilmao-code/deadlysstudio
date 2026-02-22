
-- Team members table (simple auth: username + shared team password)
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can see team members
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

-- Tasks table
CREATE TYPE public.task_status AS ENUM ('open', 'claimed', 'in_progress', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'open',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  created_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can CRUD tasks
CREATE POLICY "Anyone authenticated can view tasks"
  ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can create tasks"
  ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update tasks"
  ON public.tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can delete tasks"
  ON public.tasks FOR DELETE TO authenticated USING (true);

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
