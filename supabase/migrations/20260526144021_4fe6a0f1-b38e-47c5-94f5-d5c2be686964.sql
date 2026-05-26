
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_couples boolean GENERATED ALWAYS AS (bedrooms = 1) STORED;
CREATE INDEX IF NOT EXISTS idx_listings_district ON public.listings(district);
CREATE INDEX IF NOT EXISTS idx_listings_is_couples ON public.listings(is_couples) WHERE is_couples = true;
