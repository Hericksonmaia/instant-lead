
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS webhook_secret uuid NOT NULL DEFAULT gen_random_uuid();

CREATE POLICY "Users can update leads from their links"
ON public.leads
FOR UPDATE
TO authenticated
USING (link_id IN (
  SELECT rl.id FROM public.redirect_links rl
  WHERE rl.workspace_id IN (
    SELECT w.id FROM public.workspaces w WHERE w.owner_id = auth.uid()
  )
));

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

CREATE POLICY "Users can upload their own logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reset_link_queue(uuid) FROM anon, authenticated, public;

ALTER TABLE public.redirect_links
  ADD CONSTRAINT redirect_links_facebook_pixel_id_format
  CHECK (facebook_pixel_id IS NULL OR facebook_pixel_id ~ '^[0-9]{5,25}$') NOT VALID;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_facebook_pixel_id_format
  CHECK (facebook_pixel_id IS NULL OR facebook_pixel_id ~ '^[0-9]{5,25}$') NOT VALID;
