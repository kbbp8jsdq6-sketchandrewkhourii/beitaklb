ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS min_guests integer,
  ADD COLUMN IF NOT EXISTS bedroom_details text,
  ADD COLUMN IF NOT EXISTS bathroom_details text,
  ADD COLUMN IF NOT EXISTS kitchens integer,
  ADD COLUMN IF NOT EXISTS living_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS check_in_time text,
  ADD COLUMN IF NOT EXISTS check_out_time text,
  ADD COLUMN IF NOT EXISTS stay_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_guest_fee_weekday numeric,
  ADD COLUMN IF NOT EXISTS extra_guest_fee_weekend numeric,
  ADD COLUMN IF NOT EXISTS extra_guest_after integer,
  ADD COLUMN IF NOT EXISTS other_rates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenity_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about text,
  ADD COLUMN IF NOT EXISTS needs_details_reasons text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS details_converted_at timestamptz;

CREATE TABLE public.listing_source_descriptions (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  original_description text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_source_descriptions TO authenticated;
GRANT ALL ON public.listing_source_descriptions TO service_role;
ALTER TABLE public.listing_source_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage source descriptions" ON public.listing_source_descriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER listing_source_descriptions_updated_at BEFORE UPDATE ON public.listing_source_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();