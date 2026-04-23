-- ============================================================
-- Admin Dashboard sections 4, 6, 7, 8: tables + RLS
-- ============================================================

-- ---------- FEEDBACK ----------
CREATE TYPE public.feedback_status AS ENUM ('pending', 'approved', 'hidden');

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  status public.feedback_status NOT NULL DEFAULT 'pending',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (anon + auth)
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can read approved feedback only
CREATE POLICY "Public reads approved feedback"
  ON public.feedback FOR SELECT
  USING (status = 'approved');

-- Admins manage everything
CREATE POLICY "Admins manage feedback"
  ON public.feedback FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Only one pinned feedback at a time (partial unique index)
CREATE UNIQUE INDEX feedback_one_pinned ON public.feedback ((is_pinned)) WHERE is_pinned = true;

-- ---------- CONTACT MESSAGES ----------
CREATE TYPE public.contact_status AS ENUM ('unread', 'read', 'resolved');

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status public.contact_status NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY "Anyone can submit contact"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update/delete
CREATE POLICY "Admins manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_contact_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------- ANNOUNCEMENTS ----------
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public can read active announcements
CREATE POLICY "Public reads active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true);

-- Admins manage all announcements (incl. inactive)
CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------- SITE SETTINGS (single-row, key=1) ----------
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_email TEXT,
  business_phone TEXT,
  business_whatsapp TEXT,
  business_instagram TEXT,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  terms_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (needed for contact info, terms, maintenance flag, etc.)
CREATE POLICY "Public reads site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed the single settings row with current defaults
INSERT INTO public.site_settings (id, business_email, business_phone, business_whatsapp, business_instagram, maintenance_mode, terms_text)
VALUES (
  1,
  'beitaklb@gmail.com',
  '+961 81 160 435',
  '+961 81 160 435',
  '@beitak.lb',
  false,
  E'Welcome to Beitak. By accessing or using our platform, you agree to the following terms:\n\n1. Platform role\nBeitak acts solely as a listing platform connecting guests with property hosts. We are not responsible for the condition, accuracy, or availability of any listed property.\n\n2. User accounts\nUsers are responsible for maintaining the confidentiality of their account credentials. Beitak reserves the right to suspend accounts found to be in violation of these terms.\n\n3. Listings\nHosts are solely responsible for the accuracy of their listings including photos, descriptions, pricing, and availability. Beitak does not verify listing content.\n\n4. Intellectual property\nAll content on this platform including the Beitak name, logo, and design is the property of Beitak.lb and may not be reproduced without written permission.\n\n5. Limitation of liability\nBeitak shall not be held liable for any disputes, damages, or losses arising from transactions between guests and hosts.\n\n6. Modifications\nBeitak reserves the right to update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.\n\n7. Contact\nFor any questions regarding these terms, contact us at beitaklb@gmail.com.'
)
ON CONFLICT (id) DO NOTHING;