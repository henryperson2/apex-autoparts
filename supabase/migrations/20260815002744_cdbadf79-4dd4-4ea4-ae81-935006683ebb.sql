-- ROLES ------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Bootstrap: the first caller becomes SUPER_ADMIN, nobody after that.
CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RETURN public.is_admin(_uid);
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated, service_role;

-- SHARED updated_at TRIGGER FN ------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- HOMEPAGE SECTIONS -----------------------------------------------------
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  eyebrow text,
  title text,
  subtitle text,
  body text,
  image_url text,
  video_url text,
  cta_label text,
  cta_href text,
  cta2_label text,
  cta2_href text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published homepage sections are public" ON public.homepage_sections
  FOR SELECT USING (is_published);
CREATE POLICY "Admins read all homepage sections" ON public.homepage_sections
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage homepage sections" ON public.homepage_sections
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER homepage_sections_touch BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TESTIMONIALS ----------------------------------------------------------
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  location text,
  quote text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  avatar_url text,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published testimonials are public" ON public.testimonials
  FOR SELECT USING (is_published);
CREATE POLICY "Admins read all testimonials" ON public.testimonials
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER testimonials_touch BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PAGES + SECTIONS ------------------------------------------------------
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  eyebrow text,
  intro text,
  seo_title text,
  seo_description text,
  hero_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages are public" ON public.pages
  FOR SELECT USING (is_published);
CREATE POLICY "Admins read all pages" ON public.pages
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage pages" ON public.pages
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER pages_touch BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  heading text,
  body text,
  image_url text,
  cta_label text,
  cta_href text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.page_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT ALL ON public.page_sections TO service_role;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published page sections are public" ON public.page_sections
  FOR SELECT USING (is_published);
CREATE POLICY "Admins read all page sections" ON public.page_sections
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage page sections" ON public.page_sections
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER page_sections_touch BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NAVIGATION ------------------------------------------------------------
CREATE TABLE public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL DEFAULT 'header',
  group_label text,
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible nav items are public" ON public.nav_items
  FOR SELECT USING (is_visible);
CREATE POLICY "Admins read all nav items" ON public.nav_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage nav items" ON public.nav_items
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER nav_items_touch BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SITE SETTINGS ---------------------------------------------------------
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text,
  label text NOT NULL,
  group_name text NOT NULL DEFAULT 'general',
  input_type text NOT NULL DEFAULT 'text',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings are public" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MEDIA -----------------------------------------------------------------
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  alt_text text,
  kind text NOT NULL DEFAULT 'image',
  storage_path text,
  url text NOT NULL,
  mime_type text,
  size_bytes bigint,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media is public" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Admins manage media" ON public.media_assets
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER media_assets_touch BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NEWSLETTER ------------------------------------------------------------
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER newsletter_touch BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONTACT MESSAGES ------------------------------------------------------
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage messages" ON public.contact_messages
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER contact_messages_touch BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PRODUCTS: CMS FIELDS + ADMIN ACCESS ----------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specifications text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "Products are publicly viewable" ON public.products;
CREATE POLICY "Published products are public" ON public.products
  FOR SELECT USING (is_published AND archived_at IS NULL);
CREATE POLICY "Admins read all products" ON public.products
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CATEGORIES: ADMIN ACCESS ---------------------------------------------
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ORDERS: ADMIN ACCESS -------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE POLICY "Admins read all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Admins read all order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage order items" ON public.order_items
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- PROFILES: ADMIN ACCESS -----------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email text;

CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- SEED: SETTINGS -------------------------------------------------------
INSERT INTO public.site_settings (key, value, label, group_name, input_type, sort_order) VALUES
  ('site_name', 'Apex Auto Parts', 'Website name', 'general', 'text', 1),
  ('logo_text', 'ApexParts', 'Logo text', 'general', 'text', 2),
  ('logo_url', '', 'Logo image URL', 'general', 'text', 3),
  ('favicon_url', '/favicon.ico', 'Favicon URL', 'general', 'text', 4),
  ('seo_title', 'Apex Auto Parts — Heavy-Duty Car & Truck Parts', 'SEO title', 'seo', 'text', 1),
  ('seo_description', 'Brakes, engine, suspension, filters and electrical parts with verified fitment. Offline payment: cash on delivery, bank transfer or pay in store.', 'SEO description', 'seo', 'textarea', 2),
  ('analytics_id', '', 'Analytics measurement ID', 'seo', 'text', 3),
  ('business_name', 'Apex Auto Parts', 'Business name', 'contact', 'text', 1),
  ('phone', '(555) 018-4420', 'Phone', 'contact', 'text', 2),
  ('whatsapp', '(555) 018-4420', 'WhatsApp', 'contact', 'text', 3),
  ('email', 'counter@apexautoparts.example', 'Email', 'contact', 'text', 4),
  ('address', '1180 Fabrication Row, Detroit, MI 48207', 'Address', 'contact', 'textarea', 5),
  ('hours', 'Mon–Sat, 7am – 7pm', 'Business hours', 'contact', 'text', 6),
  ('service_area', 'Nationwide shipping, counter pickup in Detroit', 'Service area', 'contact', 'text', 7),
  ('social_facebook', '', 'Facebook URL', 'social', 'text', 1),
  ('social_instagram', '', 'Instagram URL', 'social', 'text', 2),
  ('social_x', '', 'X / Twitter URL', 'social', 'text', 3),
  ('social_youtube', '', 'YouTube URL', 'social', 'text', 4),
  ('footer_text', 'Hard-wearing replacement and performance parts for daily drivers, work trucks and weekend builds. Counter staff who actually turn wrenches.', 'Footer blurb', 'footer', 'textarea', 1),
  ('newsletter_text', 'Parts drops, clearance and workshop tips — one email a month.', 'Newsletter blurb', 'footer', 'textarea', 2),
  ('copyright_text', 'Apex Auto Parts. All prices in USD. No online card payments — offline payment only.', 'Copyright text', 'footer', 'textarea', 3),
  ('free_shipping_threshold', '250', 'Free shipping threshold', 'store', 'number', 1),
  ('flat_shipping_rate', '19.50', 'Flat shipping rate', 'store', 'number', 2);

-- SEED: NAVIGATION -----------------------------------------------------
INSERT INTO public.nav_items (location, group_label, label, href, sort_order) VALUES
  ('header', NULL, 'Home', '/', 1),
  ('header', NULL, 'Catalog', '/products', 2),
  ('header', NULL, 'Workshop', '/about', 3),
  ('header', NULL, 'Contact', '/contact', 4),
  ('footer', 'Shop', 'All parts', '/products', 1),
  ('footer', 'Shop', 'Your cart', '/cart', 2),
  ('footer', 'Shop', 'Order history', '/orders', 3),
  ('footer', 'Shop', 'Account', '/auth', 4),
  ('footer', 'Help', 'About the workshop', '/about', 1),
  ('footer', 'Help', 'Contact & fitment help', '/contact', 2);

-- SEED: HOMEPAGE -------------------------------------------------------
INSERT INTO public.homepage_sections (kind, eyebrow, title, subtitle, body, cta_label, cta_href, cta2_label, cta2_href, items, sort_order) VALUES
  ('hero', 'Est. 1994 · Counter + shipping', 'Parts that outlast the job', NULL,
   'Brakes, engine internals, suspension, filters and electrical — stocked deep, priced straight, and backed by fitment advice from real technicians.',
   'Shop the catalog', '/products', 'Fitment help', '/contact', '[]'::jsonb, 1),
  ('trust', NULL, 'Why the counter works', NULL, NULL, NULL, NULL, NULL, NULL,
   '[{"title":"Free over $250","copy":"Flat $19.50 shipping under that."},{"title":"Offline payment","copy":"Cash, transfer or pay in store."},{"title":"Warranty backed","copy":"Up to 5 years on select parts."},{"title":"Fitment checked","copy":"We verify before it ships."}]'::jsonb, 2),
  ('categories', 'Browse by system', 'Shop departments', NULL, NULL, 'All parts', '/products', NULL, NULL, '[]'::jsonb, 3),
  ('featured', 'This week', 'Counter favourites', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, 4),
  ('testimonials', 'From the bays', 'What technicians say', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, 5),
  ('payment', 'How you pay', 'No cards. No online checkout fees.', NULL,
   'Order online, then settle up the way that suits you — cash when the parts land, a bank transfer before dispatch, or straight at the counter when you collect.',
   'Start an order', '/products', NULL, NULL,
   '[{"title":"Cash on delivery","copy":"Pay the driver at your door or shop."},{"title":"Bank transfer","copy":"We send details; ships once cleared."},{"title":"Pay in store","copy":"Reserve online, collect and pay."}]'::jsonb, 6);

-- SEED: TESTIMONIALS ---------------------------------------------------
INSERT INTO public.testimonials (customer_name, location, quote, rating, is_featured, sort_order) VALUES
  ('Marcus Ellery', 'Detroit, MI', 'Ordered rotors and pads Friday, fitted them Saturday. Fitment notes were spot on for my F-150.', 5, true, 1),
  ('Dana Whitfield', 'Toledo, OH', 'The counter crew talked me out of the wrong control arm and saved me a return. That never happens online.', 5, true, 2),
  ('Ray Okonkwo', 'Flint, MI', 'Bank transfer, parts shipped same day it cleared. Packaging was solid, nothing rattling.', 5, false, 3);

-- SEED: PAGES ----------------------------------------------------------
INSERT INTO public.pages (slug, title, eyebrow, intro, seo_title, seo_description, sort_order) VALUES
  ('about', 'The workshop behind the counter', 'Since 1994', 'Three decades of stocking parts for people who fix things properly.', 'About Apex Auto Parts', 'Family-run auto parts counter since 1994, stocking brakes, engine, suspension and electrical parts.', 1),
  ('contact', 'Talk to the counter', 'Contact', 'Fitment questions, stock checks or order help — reach a real technician.', 'Contact Apex Auto Parts', 'Call, email or message the Apex Auto Parts counter for fitment help and stock checks.', 2),
  ('faq', 'Frequently asked questions', 'Help', 'Answers on payment, shipping, fitment and returns.', 'FAQ | Apex Auto Parts', 'Common questions about offline payment, shipping times, fitment checks and returns.', 3),
  ('shipping', 'Shipping', 'Delivery', 'How and when your parts arrive.', 'Shipping | Apex Auto Parts', 'Free shipping over $250, flat rate under, plus counter pickup options.', 4),
  ('returns', 'Returns', 'Policies', 'Thirty days on unfitted parts in original packaging.', 'Returns | Apex Auto Parts', 'Our 30-day return policy on unfitted auto parts in original packaging.', 5),
  ('terms', 'Terms of service', 'Policies', 'The ground rules for ordering from Apex Auto Parts.', 'Terms | Apex Auto Parts', 'Terms of service for orders placed with Apex Auto Parts.', 6),
  ('privacy', 'Privacy policy', 'Policies', 'What we store, why, and how to have it removed.', 'Privacy | Apex Auto Parts', 'How Apex Auto Parts handles your personal information.', 7);

INSERT INTO public.page_sections (page_id, heading, body, sort_order)
SELECT p.id, s.heading, s.body, s.sort_order
FROM public.pages p
JOIN (VALUES
  ('faq', 'How do I pay?', 'Cash on delivery, bank transfer before dispatch, or in person at the counter. We do not take card payments online.', 1),
  ('faq', 'How fast do parts ship?', 'In-stock parts leave the counter same day on weekdays if ordered before 3pm. Bank transfer orders ship once payment clears.', 2),
  ('faq', 'Will it fit my vehicle?', 'Every listing carries fitment notes. If you are unsure, send us your year, make, model and engine and we will confirm before shipping.', 3),
  ('shipping', 'Rates', 'Free shipping on orders over $250. A flat $19.50 applies below that. Counter pickup is always free.', 1),
  ('shipping', 'Timing', 'Same-day dispatch on weekday orders placed before 3pm. Delivery is typically 2–5 business days nationwide.', 2),
  ('returns', 'Thirty day window', 'Unfitted parts in original, undamaged packaging can be returned within 30 days of delivery for a refund or exchange.', 1),
  ('returns', 'Electrical parts', 'Electrical components are non-returnable once installed, in line with manufacturer policy.', 2),
  ('terms', 'Orders and pricing', 'Prices are in USD and may change without notice. An order is confirmed once we acknowledge it and, where applicable, payment clears.', 1),
  ('terms', 'Warranty', 'Manufacturer warranties apply as stated on each listing. Labour is not covered.', 2),
  ('privacy', 'What we collect', 'Name, contact details and delivery address so we can fulfil your order, plus your order history if you hold an account.', 1),
  ('privacy', 'Your choices', 'Email us to request a copy of your data or have your account and details removed.', 2)
) AS s(slug, heading, body, sort_order) ON s.slug = p.slug;