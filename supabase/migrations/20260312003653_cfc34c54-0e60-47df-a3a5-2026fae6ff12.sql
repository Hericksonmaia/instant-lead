
-- 1. Add pixel/token columns to redirect_links
ALTER TABLE redirect_links
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text,
  ADD COLUMN IF NOT EXISTS facebook_access_token text;

-- 2. Create evolution_instances table
CREATE TABLE IF NOT EXISTS evolution_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view instances in their workspaces"
  ON evolution_instances FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create instances in their workspaces"
  ON evolution_instances FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update instances in their workspaces"
  ON evolution_instances FOR UPDATE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete instances in their workspaces"
  ON evolution_instances FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Admins can manage all instances"
  ON evolution_instances FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
