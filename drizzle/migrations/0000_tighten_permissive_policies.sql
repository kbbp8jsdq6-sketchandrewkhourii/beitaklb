-- reservation_clicks: only valid clicks on live listings
DROP POLICY IF EXISTS "Anyone can record a reservation click" ON public.reservation_clicks;
CREATE POLICY "Anyone can record a reservation click" ON public.reservation_clicks
FOR INSERT TO anon, authenticated
WITH CHECK (
  guests BETWEEN 1 AND 20
  AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.is_active AND l.status = 'approved')
);

-- feedback: new submissions must be pending, unpinned, and owned by caller (or anonymous)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending' AND is_pinned = false
  AND (user_id IS NULL OR user_id = auth.uid())
  AND rating BETWEEN 1 AND 5
  AND char_length(author_name) BETWEEN 1 AND 100
  AND char_length(message) BETWEEN 1 AND 2000
);

-- contact_messages: new submissions must be unread and size-bounded
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'unread'
  AND char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(message) BETWEEN 1 AND 5000
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND (subject IS NULL OR char_length(subject) <= 200)
);

-- reviews: public sees reviews of live listings; reviewers and admins see their own/all
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews of live listings are public" ON public.reviews
FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.is_active AND l.status = 'approved')
  OR auth.uid() = reviewer_id
  OR public.has_role(auth.uid(), 'admin')
);

-- listing_photos: public sees photos of live listings (hosts/admins covered by existing policies)
DROP POLICY IF EXISTS "Photos viewable by everyone" ON public.listing_photos;
CREATE POLICY "Photos of live listings are public" ON public.listing_photos
FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.is_active AND l.status = 'approved')
);

-- site_settings: only the single settings row is readable
DROP POLICY IF EXISTS "Public reads site settings" ON public.site_settings;
CREATE POLICY "Public reads site settings" ON public.site_settings
FOR SELECT TO anon, authenticated
USING (id = 1);

-- hero_images: only rows with a real URL are readable
DROP POLICY IF EXISTS "Anyone can view hero images" ON public.hero_images;
CREATE POLICY "Anyone can view hero images" ON public.hero_images
FOR SELECT TO anon, authenticated
USING (url IS NOT NULL AND char_length(url) > 0);

-- hero storage: public bucket serves files by URL; listing restricted to admins
DROP POLICY IF EXISTS "Anyone can read hero objects" ON storage.objects;
CREATE POLICY "Admins can list hero objects" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));