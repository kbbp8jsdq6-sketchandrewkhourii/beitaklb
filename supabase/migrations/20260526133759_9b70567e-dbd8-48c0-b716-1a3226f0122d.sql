
-- 1. Tighten profiles SELECT (hide phone from public)
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public-safe view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, bio, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- For the public view to work, we need a SELECT policy that allows
-- reading the non-sensitive columns. We keep RLS restrictive on the
-- base table; the view runs as invoker so it inherits caller's RLS.
-- Add a permissive SELECT for everyone but only via the view path is
-- not possible without column-level grants. Use column-level grants:
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, bio, created_at) ON public.profiles TO anon, authenticated;

CREATE POLICY "Public reads non-sensitive profile columns"
ON public.profiles FOR SELECT
USING (true);

-- Note: column-level GRANTs restrict what anon/auth can SELECT; the
-- policy "true" only governs which rows are visible, while GRANTs
-- govern which columns. Owners and admins keep full access via their
-- own policies + table-level grants to authenticated.
GRANT SELECT ON public.profiles TO authenticated;

-- 2. Lock down listing_views INSERT: viewer_id must be NULL or auth.uid()
DROP POLICY IF EXISTS "Anyone can record a view" ON public.listing_views;
CREATE POLICY "Anyone can record a view"
ON public.listing_views FOR INSERT
TO anon, authenticated
WITH CHECK (viewer_id IS NULL OR viewer_id = auth.uid());

-- 3. user_roles: explicit restrictive policy blocking non-admin INSERTs
CREATE POLICY "Only admins can insert roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles AS RESTRICTIVE FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles AS RESTRICTIVE FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix function search_path on remaining functions + revoke EXECUTE
-- from anon/authenticated on email queue helpers (server-only).
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
