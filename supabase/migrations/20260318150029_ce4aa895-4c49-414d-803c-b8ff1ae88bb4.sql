
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS is_hosted boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug) WHERE slug IS NOT NULL;

CREATE POLICY "Anyone can view hosted projects by slug"
ON public.projects
FOR SELECT
TO public
USING (is_hosted = true AND slug IS NOT NULL);
