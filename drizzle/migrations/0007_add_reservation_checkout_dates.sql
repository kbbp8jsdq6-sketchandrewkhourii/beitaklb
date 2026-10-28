ALTER TABLE public.reservation_clicks
  ADD COLUMN requested_checkout date,
  ADD COLUMN backup_checkout date;