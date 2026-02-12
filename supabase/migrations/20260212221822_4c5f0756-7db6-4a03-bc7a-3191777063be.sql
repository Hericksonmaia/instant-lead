
-- Add Meta tracking columns to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS fbc text,
ADD COLUMN IF NOT EXISTS fbp text,
ADD COLUMN IF NOT EXISTS event_source_url text;

-- Add sale columns to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS sale_value numeric,
ADD COLUMN IF NOT EXISTS sale_currency text DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS sale_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS sold boolean DEFAULT false;

-- Create lead_tags junction table
CREATE TABLE IF NOT EXISTS public.lead_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_tags
CREATE POLICY "Admins can manage all lead_tags"
ON public.lead_tags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view lead_tags for their leads"
ON public.lead_tags FOR SELECT
USING (lead_id IN (
  SELECT l.id FROM leads l
  WHERE l.link_id IN (
    SELECT rl.id FROM redirect_links rl
    WHERE rl.workspace_id IN (
      SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can create lead_tags for their leads"
ON public.lead_tags FOR INSERT
WITH CHECK (lead_id IN (
  SELECT l.id FROM leads l
  WHERE l.link_id IN (
    SELECT rl.id FROM redirect_links rl
    WHERE rl.workspace_id IN (
      SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can delete lead_tags for their leads"
ON public.lead_tags FOR DELETE
USING (lead_id IN (
  SELECT l.id FROM leads l
  WHERE l.link_id IN (
    SELECT rl.id FROM redirect_links rl
    WHERE rl.workspace_id IN (
      SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()
    )
  )
));

-- Allow public insert to include new columns
-- (leads already has public insert policy)

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag_id ON public.lead_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_leads_sold ON public.leads(sold) WHERE sold = true;
