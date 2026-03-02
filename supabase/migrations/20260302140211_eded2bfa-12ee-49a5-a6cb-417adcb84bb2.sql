
-- Add theme columns to redirect_links
ALTER TABLE public.redirect_links 
  ADD COLUMN IF NOT EXISTS theme_bg_color TEXT DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS theme_text_color TEXT DEFAULT '#f8fafc',
  ADD COLUMN IF NOT EXISTS theme_button_bg TEXT DEFAULT '#22c55e',
  ADD COLUMN IF NOT EXISTS theme_button_text TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS theme_font TEXT DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create menu_items table for multiple links in menu mode
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.redirect_links(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage menu_items through their workspace links
CREATE POLICY "Users can view menu_items of their links" ON public.menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.redirect_links rl
      JOIN public.workspaces w ON w.id = rl.workspace_id
      WHERE rl.id = menu_items.link_id AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menu_items for their links" ON public.menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.redirect_links rl
      JOIN public.workspaces w ON w.id = rl.workspace_id
      WHERE rl.id = menu_items.link_id AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update menu_items of their links" ON public.menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.redirect_links rl
      JOIN public.workspaces w ON w.id = rl.workspace_id
      WHERE rl.id = menu_items.link_id AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete menu_items of their links" ON public.menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.redirect_links rl
      JOIN public.workspaces w ON w.id = rl.workspace_id
      WHERE rl.id = menu_items.link_id AND w.owner_id = auth.uid()
    )
  );

-- Public read for redirect page rendering
CREATE POLICY "Anyone can view menu_items for public links" ON public.menu_items
  FOR SELECT USING (true);
