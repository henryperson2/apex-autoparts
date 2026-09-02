DROP POLICY IF EXISTS "Media files are readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins update media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete media files" ON storage.objects;

CREATE POLICY "Media files are readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

CREATE POLICY "Admins upload media files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update media files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins delete media files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND public.is_admin(auth.uid()));