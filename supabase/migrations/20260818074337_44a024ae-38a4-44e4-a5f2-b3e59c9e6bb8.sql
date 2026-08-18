-- Clean out demo-era schema
DROP FUNCTION IF EXISTS public.track_order(text);
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.custom_requests CASCADE;
DROP TABLE IF EXISTS public.paintings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text,
  role public.app_role NOT NULL DEFAULT 'user',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- role column may never be self-assigned; it mirrors user_roles
CREATE OR REPLACE FUNCTION public.profiles_guard_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.role := CASE WHEN public.has_role(NEW.user_id, 'admin') THEN 'admin'::public.app_role ELSE 'user'::public.app_role END;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_guard_role_ins BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role();
CREATE TRIGGER profiles_guard_role_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role();

-- ARTIST SETTINGS
CREATE TABLE public.artist_settings (
  id integer PRIMARY KEY DEFAULT 1,
  artist_name text NOT NULL DEFAULT '',
  bio text,
  profile_image_url text,
  whatsapp_number text NOT NULL DEFAULT '',
  instagram_username text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  delivery_fee numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT artist_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.artist_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.artist_settings TO authenticated;
GRANT ALL ON public.artist_settings TO service_role;
ALTER TABLE public.artist_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.artist_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.artist_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER artist_settings_updated_at BEFORE UPDATE ON public.artist_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.artist_settings (id) VALUES (1);

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PAINTINGS
CREATE TABLE public.paintings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id text NOT NULL UNIQUE,
  title text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  story text,
  medium text,
  width numeric,
  height numeric,
  year integer,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.paintings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paintings TO authenticated;
GRANT ALL ON public.paintings TO service_role;
ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paintings public read" ON public.paintings FOR SELECT TO anon, authenticated USING (status <> 'archived');
CREATE POLICY "paintings admin all" ON public.paintings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER paintings_updated_at BEFORE UPDATE ON public.paintings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_artwork_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE yr text := to_char(now(), 'YYYY'); n integer;
BEGIN
  IF NEW.artwork_id IS NULL OR btrim(NEW.artwork_id) = '' THEN
    SELECT COALESCE(MAX(substring(artwork_id from '[0-9]+$')::int), 0) + 1 INTO n
    FROM public.paintings WHERE artwork_id LIKE 'ART-' || yr || '-%';
    NEW.artwork_id := 'ART-' || yr || '-' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER paintings_artwork_id BEFORE INSERT ON public.paintings FOR EACH ROW EXECUTE FUNCTION public.set_artwork_id();

-- PAINTING IMAGES
CREATE TABLE public.painting_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  painting_id uuid NOT NULL REFERENCES public.paintings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.painting_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.painting_images TO authenticated;
GRANT ALL ON public.painting_images TO service_role;
ALTER TABLE public.painting_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "painting images public read" ON public.painting_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "painting images admin write" ON public.painting_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers public insert" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "customers admin read" ON public.customers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customers admin update" ON public.customers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customers admin delete" ON public.customers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  province text,
  district text,
  municipality text,
  address text,
  landmark text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.addresses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses public insert" ON public.addresses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "addresses admin read" ON public.addresses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "addresses admin update" ON public.addresses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "addresses admin delete" ON public.addresses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation','confirmed','preparing','shipped','delivered','cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders public insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending_confirmation' AND payment_status = 'pending');
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE yr text := to_char(now(), 'YYYY'); n integer;
BEGIN
  SELECT COALESCE(MAX(substring(order_number from '[0-9]+$')::int), 0) + 1 INTO n
  FROM public.orders WHERE order_number LIKE 'ART-ORDER-' || yr || '-%';
  NEW.order_number := 'ART-ORDER-' || yr || '-' || lpad(n::text, 4, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  painting_id uuid REFERENCES public.paintings(id) ON DELETE SET NULL,
  painting_title_snapshot text NOT NULL,
  painting_price_snapshot numeric NOT NULL DEFAULT 0,
  artwork_id_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items public insert" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "order items admin read" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "order items admin write" ON public.order_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "order items admin delete" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications admin read" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "notifications admin update" ON public.notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "notifications admin delete" ON public.notifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CUSTOM REQUESTS
CREATE TABLE public.custom_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  whatsapp text,
  idea text NOT NULL,
  preferred_size text,
  budget text,
  deadline date,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','in_progress','completed','cancelled')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.custom_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_requests TO authenticated;
GRANT ALL ON public.custom_requests TO service_role;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom public insert" ON public.custom_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "custom admin read" ON public.custom_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "custom admin update" ON public.custom_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "custom admin delete" ON public.custom_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER custom_requests_updated_at BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.custom_request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  image_url text,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.custom_request_images TO anon;
GRANT SELECT, INSERT, DELETE ON public.custom_request_images TO authenticated;
GRANT ALL ON public.custom_request_images TO service_role;
ALTER TABLE public.custom_request_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom images public insert" ON public.custom_request_images FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "custom images admin read" ON public.custom_request_images FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "custom images admin delete" ON public.custom_request_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AUTOMATIC NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, link)
  VALUES ('order', 'New Order Received', 'Order ' || NEW.order_number || ' was placed.', '/admin/orders');
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_notify AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

CREATE OR REPLACE FUNCTION public.notify_new_custom_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, link)
  VALUES ('custom', 'New Custom Painting Request', NEW.name || ' sent a commission enquiry.', '/admin/requests');
  RETURN NEW;
END; $$;
CREATE TRIGGER custom_requests_notify AFTER INSERT ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.notify_new_custom_request();

-- PAYMENT CONFIRMATION: mark paid + confirmed + painting sold + notification
CREATE OR REPLACE FUNCTION public.confirm_order_payment(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorised'; END IF;
  UPDATE public.orders SET payment_status = 'paid',
    status = CASE WHEN status = 'pending_confirmation' THEN 'confirmed' ELSE status END
  WHERE id = _order_id;
  UPDATE public.paintings p SET status = 'sold'
  FROM public.order_items oi WHERE oi.order_id = _order_id AND oi.painting_id = p.id;
  SELECT string_agg(painting_title_snapshot, ', ') INTO t FROM public.order_items WHERE order_id = _order_id;
  INSERT INTO public.notifications (type, title, message, link)
  VALUES ('payment', 'Payment Received', 'Payment received for ' || COALESCE(t, 'an order') || '.', '/admin/orders');
END; $$;
REVOKE ALL ON FUNCTION public.confirm_order_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid) TO authenticated;

-- PUBLIC ORDER TRACKING (status only)
CREATE OR REPLACE FUNCTION public.track_order(_order_number text)
RETURNS TABLE(order_number text, status text, payment_status text, created_at timestamptz, updated_at timestamptz, items text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.status, o.payment_status, o.created_at, o.updated_at,
         (SELECT string_agg(oi.painting_title_snapshot, ', ') FROM public.order_items oi WHERE oi.order_id = o.id)
  FROM public.orders o
  WHERE upper(o.order_number) = upper(btrim(_order_number))
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;

-- claim_admin also creates the profile row
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.profiles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.claim_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

INSERT INTO public.categories (name) VALUES ('Landscape'), ('Portrait'), ('Abstract'), ('Cultural'), ('Other')
ON CONFLICT (name) DO NOTHING;