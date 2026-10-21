ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS holiday_collection_selected text[] NOT NULL DEFAULT '{}';
UPDATE public.site_settings SET holiday_collection_selected = ARRAY['Arez','Ehden','Faqra','Faraya','Kfardebian','Mzaar','Zaarour'] WHERE id = 1;
COMMENT ON COLUMN public.site_settings.holiday_collection_locations IS 'DEPRECATED: replaced by holiday_collection_selected';