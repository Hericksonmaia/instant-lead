-- Allow public read access to redirect_contacts for the redirect page
CREATE POLICY "Public can read contacts for redirection"
ON public.redirect_contacts
FOR SELECT
USING (true);

-- Allow public read access to redirect_links for the redirect page
CREATE POLICY "Public can read links by slug"
ON public.redirect_links
FOR SELECT
USING (true);