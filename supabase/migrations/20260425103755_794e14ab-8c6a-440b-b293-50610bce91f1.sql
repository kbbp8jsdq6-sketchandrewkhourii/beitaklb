ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings (featured) WHERE featured = true;