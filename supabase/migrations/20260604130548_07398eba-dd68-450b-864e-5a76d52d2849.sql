CREATE POLICY "Anyone can read hero objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero');

CREATE POLICY "Admins can upload hero objects"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));