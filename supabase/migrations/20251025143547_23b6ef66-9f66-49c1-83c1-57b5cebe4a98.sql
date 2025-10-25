-- Add facebook_access_token column to redirect_links table
ALTER TABLE public.redirect_links
ADD COLUMN facebook_access_token TEXT;

COMMENT ON COLUMN public.redirect_links.facebook_access_token IS 'Facebook API Access Token for Conversions API';