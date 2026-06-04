CREATE TABLE public.hero_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_images TO authenticated;
GRANT ALL ON public.hero_images TO service_role;

ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hero images"
  ON public.hero_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert hero images"
  ON public.hero_images FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero images"
  ON public.hero_images FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero images"
  ON public.hero_images FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hero_images_updated_at
  BEFORE UPDATE ON public.hero_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();