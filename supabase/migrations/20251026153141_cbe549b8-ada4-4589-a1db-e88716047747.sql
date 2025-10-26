-- Fix 1: Drop public SELECT policy on redirect_contacts (exposes phone numbers)
DROP POLICY IF EXISTS "Public can view redirect contacts" ON public.redirect_contacts;

-- Fix 2: Move Facebook tokens to workspace level (more secure, one token per workspace)
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS facebook_access_token text,
ADD COLUMN IF NOT EXISTS facebook_pixel_id text;

-- Migrate existing tokens from redirect_links to workspaces
-- Take the first non-null token from each workspace's links
UPDATE public.workspaces w
SET 
  facebook_access_token = subquery.token,
  facebook_pixel_id = subquery.pixel_id
FROM (
  SELECT DISTINCT ON (rl.workspace_id)
    rl.workspace_id,
    rl.facebook_access_token as token,
    rl.pixel_id as pixel_id
  FROM public.redirect_links rl
  WHERE rl.facebook_access_token IS NOT NULL
  ORDER BY rl.workspace_id, rl.created_at DESC
) AS subquery
WHERE w.id = subquery.workspace_id;

-- Remove exposed token columns from redirect_links
ALTER TABLE public.redirect_links 
DROP COLUMN IF EXISTS facebook_access_token,
DROP COLUMN IF EXISTS pixel_id,
DROP COLUMN IF EXISTS pixel_event;