-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create link_tags junction table
CREATE TABLE public.link_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.redirect_links(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(link_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_tags ENABLE ROW LEVEL SECURITY;

-- Tags RLS policies
CREATE POLICY "Users can view tags in their workspaces"
ON public.tags FOR SELECT
USING (workspace_id IN (
  SELECT id FROM workspaces WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can create tags in their workspaces"
ON public.tags FOR INSERT
WITH CHECK (workspace_id IN (
  SELECT id FROM workspaces WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can update tags in their workspaces"
ON public.tags FOR UPDATE
USING (workspace_id IN (
  SELECT id FROM workspaces WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can delete tags in their workspaces"
ON public.tags FOR DELETE
USING (workspace_id IN (
  SELECT id FROM workspaces WHERE owner_id = auth.uid()
));

-- Link_tags RLS policies
CREATE POLICY "Users can view link_tags for their links"
ON public.link_tags FOR SELECT
USING (link_id IN (
  SELECT id FROM redirect_links WHERE workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  )
));

CREATE POLICY "Users can create link_tags for their links"
ON public.link_tags FOR INSERT
WITH CHECK (link_id IN (
  SELECT id FROM redirect_links WHERE workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  )
));

CREATE POLICY "Users can delete link_tags for their links"
ON public.link_tags FOR DELETE
USING (link_id IN (
  SELECT id FROM redirect_links WHERE workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  )
));

-- Admin policies for tags
CREATE POLICY "Admins can manage all tags"
ON public.tags FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all link_tags"
ON public.link_tags FOR ALL
USING (has_role(auth.uid(), 'admin'));