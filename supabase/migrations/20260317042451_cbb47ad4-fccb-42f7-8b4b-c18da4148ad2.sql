
-- Add a conversations column to projects to persist chat history
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS conversations jsonb DEFAULT '[]'::jsonb;

-- Add a shared column so users can share projects via public link
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS share_id text UNIQUE DEFAULT NULL;

-- Create a policy so anyone can view shared projects
CREATE POLICY "Anyone can view shared projects"
ON public.projects
FOR SELECT
USING (is_shared = true);
