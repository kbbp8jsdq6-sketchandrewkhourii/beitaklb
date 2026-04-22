-- Add category column to listings (villa | cabin | apartment)
CREATE TYPE public.listing_category AS ENUM ('villa', 'cabin', 'apartment');

ALTER TABLE public.listings
  ADD COLUMN category public.listing_category NOT NULL DEFAULT 'apartment';

-- Drop the default so future inserts must specify a category explicitly
ALTER TABLE public.listings ALTER COLUMN category DROP DEFAULT;

CREATE INDEX idx_listings_category ON public.listings(category);