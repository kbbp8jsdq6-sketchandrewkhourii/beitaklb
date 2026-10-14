CREATE FUNCTION public.reorder_google_reviews(review_ids uuid[]) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF cardinality(review_ids) <> (SELECT count(DISTINCT id) FROM unnest(review_ids) AS id) OR cardinality(review_ids) <> (SELECT count(*) FROM public.google_reviews) OR EXISTS (SELECT 1 FROM unnest(review_ids) AS requested(id) WHERE NOT EXISTS (SELECT 1 FROM public.google_reviews AS r WHERE r.id = requested.id)) THEN
    RAISE EXCEPTION 'Reviews changed. Reload and try again.';
  END IF;
  UPDATE public.google_reviews AS r SET display_order = ordered.position - 1 FROM unnest(review_ids) WITH ORDINALITY AS ordered(id, position) WHERE r.id = ordered.id;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_google_reviews(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_google_reviews(uuid[]) TO authenticated;