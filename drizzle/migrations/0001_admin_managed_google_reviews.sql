CREATE TABLE public.google_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL CHECK (length(trim(guest_name)) BETWEEN 1 AND 150),
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review_text text NOT NULL CHECK (length(trim(review_text)) BETWEEN 1 AND 10000),
  property_name text CHECK (property_name IS NULL OR length(property_name) <= 200),
  featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.google_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_reviews TO authenticated;
GRANT ALL ON public.google_reviews TO service_role;
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read Google reviews" ON public.google_reviews FOR SELECT TO anon, authenticated USING (length(trim(review_text)) > 0);
CREATE POLICY "Admins can insert Google reviews" ON public.google_reviews FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update Google reviews" ON public.google_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete Google reviews" ON public.google_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX google_reviews_order_idx ON public.google_reviews(display_order, created_at);
CREATE UNIQUE INDEX google_reviews_single_featured_idx ON public.google_reviews(featured) WHERE featured;
CREATE FUNCTION public.set_google_review_featured() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.featured THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000002);
    UPDATE public.google_reviews SET featured = false WHERE featured AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_google_review_featured() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER google_reviews_featured BEFORE INSERT OR UPDATE OF featured ON public.google_reviews FOR EACH ROW EXECUTE FUNCTION public.set_google_review_featured();
CREATE TRIGGER google_reviews_updated_at BEFORE UPDATE ON public.google_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.site_settings ADD COLUMN google_rating numeric(2,1) CHECK (google_rating BETWEEN 1 AND 5);
ALTER TABLE public.site_settings ADD COLUMN google_review_count integer CHECK (google_review_count >= 0);