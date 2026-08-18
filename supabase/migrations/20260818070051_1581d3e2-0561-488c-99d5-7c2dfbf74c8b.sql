
CREATE TYPE public.app_role AS ENUM ('admin','user');

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

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.paintings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_code text NOT NULL UNIQUE,
  title text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  medium text,
  dimensions text,
  year integer,
  category text NOT NULL DEFAULT 'Other',
  description text,
  story text,
  images text[] NOT NULL DEFAULT '{}',
  availability text NOT NULL DEFAULT 'available',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.paintings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paintings TO authenticated;
GRANT ALL ON public.paintings TO service_role;
ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paintings public read" ON public.paintings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "paintings admin write" ON public.paintings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER paintings_updated_at BEFORE UPDATE ON public.paintings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE,
  painting_id uuid REFERENCES public.paintings(id) ON DELETE SET NULL,
  painting_title text NOT NULL,
  artwork_code text,
  full_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  province text,
  district text,
  municipality text,
  address text,
  landmark text,
  instructions text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'placed',
  payment_status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders public insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.track_order(_order_code text)
RETURNS TABLE (order_code text, painting_title text, status text, payment_status text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_code, o.painting_title, o.status, o.payment_status, o.created_at, o.updated_at
  FROM public.orders o WHERE upper(o.order_code) = upper(trim(_order_code)) LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;

CREATE TABLE public.custom_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  whatsapp text,
  email text,
  idea text NOT NULL,
  preferred_size text,
  budget text,
  deadline date,
  reference_image text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.custom_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_requests TO authenticated;
GRANT ALL ON public.custom_requests TO service_role;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom public insert" ON public.custom_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "custom admin read" ON public.custom_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "custom admin update" ON public.custom_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "custom admin delete" ON public.custom_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER custom_requests_updated_at BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact public insert" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact admin read" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "contact admin update" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "contact admin delete" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications public insert" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "notifications admin read" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications admin update" ON public.notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications admin delete" ON public.notifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  artist_name text NOT NULL DEFAULT 'Aarati Shrestha',
  artist_statement text NOT NULL DEFAULT 'Painting the light, silence and colour of the Himalaya.',
  artist_bio text,
  hero_image text,
  whatsapp_number text NOT NULL DEFAULT '9779800000000',
  instagram_username text NOT NULL DEFAULT 'artist',
  contact_email text NOT NULL DEFAULT 'hello@example.com',
  location text NOT NULL DEFAULT 'Kathmandu, Nepal',
  delivery_fee numeric(12,2) NOT NULL DEFAULT 500,
  currency text NOT NULL DEFAULT 'NPR',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id, artist_bio) VALUES (1, 'Born in the Kathmandu Valley, the artist works in oil and acrylic, translating Himalayan light and Newari heritage into contemporary canvases.');

CREATE POLICY "artwork public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'artwork');
CREATE POLICY "artwork admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'artwork' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "artwork admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'artwork' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "artwork admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'artwork' AND public.has_role(auth.uid(),'admin'));
