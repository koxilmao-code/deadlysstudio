
-- Add new columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS why_it_matters text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS common_mistakes text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS role_category text DEFAULT 'general' CHECK (role_category IN ('general', 'scripter', 'designer', 'promoter'));

-- Task dependencies (many-to-many)
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on)
);
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage dependencies" ON public.task_dependencies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Developer notes per task
CREATE TABLE public.task_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.team_members(id),
  content text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'bug', 'edge_case', 'performance', 'hack', 'todo')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage notes" ON public.task_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_notes;

-- Add role to team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS role text DEFAULT 'general' CHECK (role IN ('general', 'scripter', 'designer', 'promoter', 'lead'));

-- Wiki / Knowledge Base
CREATE TABLE public.wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  category text DEFAULT 'general' CHECK (category IN ('general', 'coding_standards', 'architecture', 'combat', 'networking', 'performance', 'naming', 'folder_structure')),
  created_by uuid REFERENCES public.team_members(id),
  updated_by uuid REFERENCES public.team_members(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage wiki" ON public.wiki_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Change log
CREATE TABLE public.change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  changes jsonb,
  changed_by uuid REFERENCES public.team_members(id),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view change logs" ON public.change_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert change logs" ON public.change_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_task_notes_updated_at BEFORE UPDATE ON public.task_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wiki_pages_updated_at BEFORE UPDATE ON public.wiki_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
