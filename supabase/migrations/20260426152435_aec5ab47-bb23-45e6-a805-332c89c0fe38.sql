-- Performance indexes for paginated listings queries.
-- These speed up filtering by category/location/price/featured and sorting by created_at.
CREATE INDEX IF NOT EXISTS idx_listings_active_created
  ON public.listings (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_category_active
  ON public.listings (category, is_active);

CREATE INDEX IF NOT EXISTS idx_listings_featured_active
  ON public.listings (featured, is_active) WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_listings_location_lower
  ON public.listings (lower(location));

CREATE INDEX IF NOT EXISTS idx_listings_price_weekday
  ON public.listings (price_weekday);

CREATE INDEX IF NOT EXISTS idx_listings_bedrooms
  ON public.listings (bedrooms);

CREATE INDEX IF NOT EXISTS idx_listings_bathrooms
  ON public.listings (bathrooms);

-- GIN index on amenities array for fast contains queries
CREATE INDEX IF NOT EXISTS idx_listings_amenities_gin
  ON public.listings USING gin (amenities);

-- Speed up listing_photos joins per listing
CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_order
  ON public.listing_photos (listing_id, display_order);