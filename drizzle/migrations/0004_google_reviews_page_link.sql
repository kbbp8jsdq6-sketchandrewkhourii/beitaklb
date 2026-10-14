ALTER TABLE public.site_settings ADD COLUMN google_reviews_page_link text;
UPDATE public.site_settings SET google_reviews_page_link = 'https://search.google.com/local/reviews?placeid=ChIJpZvkjVn7IRURulJ9PjQiON4' WHERE id = 1;
COMMENT ON TABLE public.feedback IS 'DEPRECATED: Feedback pages retired in favor of admin-managed Google reviews; preserve all existing feedback data.';