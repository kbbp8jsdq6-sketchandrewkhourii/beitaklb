-- Add weekday/weekend prices to listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS price_weekday numeric,
  ADD COLUMN IF NOT EXISTS price_weekend numeric;

-- Backfill from existing price_per_night
UPDATE public.listings
SET price_weekday = COALESCE(price_weekday, price_per_night),
    price_weekend = COALESCE(price_weekend, price_per_night)
WHERE price_weekday IS NULL OR price_weekend IS NULL;

-- Set NOT NULL with safe defaults
ALTER TABLE public.listings
  ALTER COLUMN price_weekday SET NOT NULL,
  ALTER COLUMN price_weekend SET NOT NULL;

-- Keep price_per_night in sync (lower of the two) on insert/update
CREATE OR REPLACE FUNCTION public.sync_listing_price_per_night()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price_weekday IS NOT NULL AND NEW.price_weekend IS NOT NULL THEN
    NEW.price_per_night := LEAST(NEW.price_weekday, NEW.price_weekend);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_price_per_night_trigger ON public.listings;
CREATE TRIGGER sync_price_per_night_trigger
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_price_per_night();

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users add own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_listing_id_idx ON public.favorites(listing_id);