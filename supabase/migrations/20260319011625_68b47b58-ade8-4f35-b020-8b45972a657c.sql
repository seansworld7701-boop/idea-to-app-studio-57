
-- Collaborators table: tracks who can collaborate on a project (max 3 per project enforced in app)
CREATE TABLE public.project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner can manage collaborators (owner = projects.user_id)
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = _user_id
  )
$$;

-- Owner can view collaborators
CREATE POLICY "Owner can view collaborators"
ON public.project_collaborators FOR SELECT
TO authenticated
USING (public.is_project_owner(project_id, auth.uid()));

-- Collaborator can view their own membership
CREATE POLICY "Collaborator can view own membership"
ON public.project_collaborators FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owner can add collaborators
CREATE POLICY "Owner can add collaborators"
ON public.project_collaborators FOR INSERT
TO authenticated
WITH CHECK (public.is_project_owner(project_id, auth.uid()));

-- Owner can remove collaborators
CREATE POLICY "Owner can delete collaborators"
ON public.project_collaborators FOR DELETE
TO authenticated
USING (public.is_project_owner(project_id, auth.uid()));

-- Collaborators can view the project they're collaborating on
CREATE POLICY "Collaborators can view project"
ON public.projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_collaborators.project_id = projects.id
    AND project_collaborators.user_id = auth.uid()
  )
);

-- Collaborators can update project conversations
CREATE POLICY "Collaborators can update project"
ON public.projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_collaborators.project_id = projects.id
    AND project_collaborators.user_id = auth.uid()
  )
);

-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
