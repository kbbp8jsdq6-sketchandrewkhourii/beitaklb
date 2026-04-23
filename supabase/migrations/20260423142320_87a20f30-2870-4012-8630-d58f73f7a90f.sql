-- 1) Approval status enum + columns on listings
DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS status public.listing_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Existing listings stay approved (already covered by default, but be explicit)
UPDATE public.listings SET status = 'approved' WHERE status IS NULL;

-- 2) Listing views table for "most viewed" analytics
CREATE TABLE IF NOT EXISTS public.listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_views_listing_id_idx ON public.listing_views(listing_id);
CREATE INDEX IF NOT EXISTS listing_views_created_at_idx ON public.listing_views(created_at DESC);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can insert a view event
DROP POLICY IF EXISTS "Anyone can record a view" ON public.listing_views;
CREATE POLICY "Anyone can record a view"
ON public.listing_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read raw view rows
DROP POLICY IF EXISTS "Admins read all views" ON public.listing_views;
CREATE POLICY "Admins read all views"
ON public.listing_views
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Admins should also be able to UPDATE listings (status, etc.)
-- An "Admins update any listing" policy already exists per project schema, so we leave it.
-- But ensure admin can also UPDATE status / rejection fields specifically:
-- (the existing policy uses USING has_role, which already allows updating any column)

-- 4) Helpful: index favorites by listing for "most favorited" query
CREATE INDEX IF NOT EXISTS favorites_listing_id_idx ON public.favorites(listing_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings(status);
