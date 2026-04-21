-- Add FK constraints from public tables to profiles so PostgREST can resolve `profiles:host_id` joins.
ALTER TABLE public.listings
  ADD CONSTRAINT listings_host_profile_fk FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_guest_profile_fk FOREIGN KEY (guest_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_profile_fk FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;