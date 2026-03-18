
-- Add logo_url column
ALTER TABLE public.redirect_links ADD COLUMN IF NOT EXISTS logo_url text;
