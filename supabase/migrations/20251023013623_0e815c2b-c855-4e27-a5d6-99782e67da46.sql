-- Add public read access policy for redirect links by slug
-- This allows anyone to view a redirect link when accessing /r/:slug
CREATE POLICY "Public can view redirect links by slug"
ON public.redirect_links
FOR SELECT
USING (true);

-- Add public read access for redirect contacts
-- Needed to fetch contact phone numbers during redirect
CREATE POLICY "Public can view redirect contacts"
ON public.redirect_contacts
FOR SELECT
USING (true);