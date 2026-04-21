-- Fix search_path on functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Bucket: photos still publicly viewable by URL (anon GET via storage CDN works regardless of policies for public buckets),
-- but to satisfy linter restrict the SELECT policy on storage.objects to owner/admin (prevents `list` calls listing arbitrary files).
DROP POLICY IF EXISTS "Listing photos publicly viewable" ON storage.objects;

CREATE POLICY "Owners and admins can list listing photos" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'listing-photos' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );