-- Runtime hardening and deployment repairs.
-- This migration is intentionally additive: do not drop production business tables.

-- Keep the artist statement separate from the biography.
ALTER TABLE public.artist_settings
  ADD COLUMN IF NOT EXISTS artist_statement text NOT NULL DEFAULT '';

ALTER TABLE public.artist_settings
  DROP CONSTRAINT IF EXISTS artist_settings_statement_length;

ALTER TABLE public.artist_settings
  ADD CONSTRAINT artist_settings_statement_length
  CHECK (length(artist_statement) <= 300);

UPDATE public.artist_settings
SET delivery_fee = 0
WHERE delivery_fee < 0;

ALTER TABLE public.artist_settings
  DROP CONSTRAINT IF EXISTS artist_settings_delivery_fee_nonnegative;

ALTER TABLE public.artist_settings
  ADD CONSTRAINT artist_settings_delivery_fee_nonnegative
  CHECK (delivery_fee >= 0);

-- The application references these buckets. Creating them here makes a fresh
-- Supabase project deployable without an undocumented dashboard step.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'painting-images',
    'painting-images',
    true,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::text[]
  ),
  (
    'artist-assets',
    'artist-assets',
    false,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::text[]
  ),
  (
    'custom-request-images',
    'custom-request-images',
    false,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public sign-up must never be able to claim the first administrator. Admin
-- access is provisioned by the trusted bootstrap command below/README.
REVOKE ALL ON FUNCTION public.claim_admin() FROM PUBLIC, anon, authenticated;

-- Keep profiles.role as a display/cache field, but derive it from the real
-- user_roles table even when an administrator is provisioned by a service key.
CREATE OR REPLACE FUNCTION public.profiles_guard_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.role := CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = NEW.user_id
        AND role = 'admin'::public.app_role
    ) THEN 'admin'::public.app_role
    ELSE 'user'::public.app_role
  END;
  RETURN NEW;
END;
$$;

-- Random public identifiers prevent duplicate MAX()+1 races and make order
-- tracking codes non-enumerable.
CREATE OR REPLACE FUNCTION public.set_artwork_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.artwork_id IS NULL OR btrim(NEW.artwork_id) = '' THEN
    NEW.artwork_id := 'ART-' || to_char(current_date, 'YYYY') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'ART-ORDER-' || to_char(current_date, 'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  RETURN NEW;
END;
$$;

-- Do not let the admin status selector claim payment has been confirmed.
CREATE OR REPLACE FUNCTION public.validate_order_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.subtotal < 0 OR NEW.delivery_fee < 0 OR NEW.total <> NEW.subtotal + NEW.delivery_fee THEN
    RAISE EXCEPTION 'Order totals are invalid';
  END IF;
  IF NEW.status IN ('confirmed', 'preparing', 'shipped', 'delivered')
     AND NEW.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'Payment must be confirmed before advancing the order';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_order_state() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_validate_state ON public.orders;
CREATE TRIGGER orders_validate_state
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_state();

-- Payment status is changed only by the guarded confirmation RPC. The admin
-- UI needs to edit status and private notes, not the financial fields.
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (status, admin_notes) ON public.orders TO authenticated;

-- Replace the guest order function with a transaction-safe version. The
-- painting row is locked before checking for another non-cancelled order, so a
-- unique artwork cannot be sold twice through concurrent requests.
DROP FUNCTION IF EXISTS public.place_guest_order(
  text, text, text, text, text, text, text, text, text, text, uuid, numeric
);

CREATE OR REPLACE FUNCTION public.place_guest_order(
  _name text,
  _phone text,
  _whatsapp text,
  _email text,
  _province text,
  _district text,
  _municipality text,
  _address text,
  _landmark text,
  _instructions text,
  _painting_id uuid,
  _delivery_fee numeric
)
RETURNS TABLE(
  order_number text,
  subtotal numeric,
  delivery_fee numeric,
  total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cid uuid;
  aid uuid;
  oid uuid;
  onum text;
  p record;
  fee numeric;
  sub numeric;
BEGIN
  IF _name IS NULL OR length(btrim(_name)) < 2 OR length(btrim(_name)) > 120 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  IF _phone IS NULL OR length(btrim(_phone)) < 7 OR length(btrim(_phone)) > 40 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF _address IS NULL OR length(btrim(_address)) < 4 OR length(btrim(_address)) > 500 THEN
    RAISE EXCEPTION 'Invalid delivery address';
  END IF;
  IF _email IS NOT NULL AND length(btrim(_email)) > 200 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _email IS NOT NULL AND btrim(_email) <> ''
     AND btrim(_email) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _whatsapp IS NOT NULL AND length(btrim(_whatsapp)) > 40 THEN
    RAISE EXCEPTION 'Invalid WhatsApp number';
  END IF;
  IF _province IS NOT NULL AND length(btrim(_province)) > 100
     OR _district IS NOT NULL AND length(btrim(_district)) > 100
     OR _municipality IS NOT NULL AND length(btrim(_municipality)) > 150
     OR _landmark IS NOT NULL AND length(btrim(_landmark)) > 200
     OR _instructions IS NOT NULL AND length(btrim(_instructions)) > 500 THEN
    RAISE EXCEPTION 'One or more delivery fields are too long';
  END IF;

  SELECT id, title, price, artwork_id, status
  INTO p
  FROM public.paintings
  WHERE id = _painting_id
  FOR UPDATE;

  IF p.id IS NULL THEN
    RAISE EXCEPTION 'Painting not found';
  END IF;
  IF p.status <> 'available' OR p.price <= 0 THEN
    RAISE EXCEPTION 'Painting is not available';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.painting_id = p.id
      AND o.status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Painting is already reserved';
  END IF;

  -- Never trust a delivery fee supplied by the browser.
  SELECT COALESCE(delivery_fee, 0)
  INTO fee
  FROM public.artist_settings
  WHERE id = 1;
  fee := COALESCE(fee, 0);
  sub := p.price;

  INSERT INTO public.customers (name, email, phone, whatsapp)
  VALUES (
    btrim(_name),
    NULLIF(btrim(COALESCE(_email, '')), ''),
    btrim(_phone),
    NULLIF(btrim(COALESCE(_whatsapp, '')), '')
  )
  RETURNING id INTO cid;

  INSERT INTO public.addresses (
    customer_id, province, district, municipality, address, landmark, instructions
  )
  VALUES (
    cid,
    NULLIF(btrim(COALESCE(_province, '')), ''),
    NULLIF(btrim(COALESCE(_district, '')), ''),
    NULLIF(btrim(COALESCE(_municipality, '')), ''),
    NULLIF(btrim(COALESCE(_address, '')), ''),
    NULLIF(btrim(COALESCE(_landmark, '')), ''),
    NULLIF(btrim(COALESCE(_instructions, '')), '')
  )
  RETURNING id INTO aid;

  INSERT INTO public.orders (
    order_number, customer_id, address_id, status, payment_status,
    subtotal, delivery_fee, total
  )
  VALUES (
    'pending', cid, aid, 'pending_confirmation', 'pending',
    sub, fee, sub + fee
  )
  RETURNING id, order_number INTO oid, onum;

  INSERT INTO public.order_items (
    order_id, painting_id, painting_title_snapshot,
    painting_price_snapshot, artwork_id_snapshot
  )
  VALUES (oid, p.id, p.title, p.price, p.artwork_id);

  RETURN QUERY SELECT onum, sub, fee, sub + fee;
END;
$$;

REVOKE ALL ON FUNCTION public.place_guest_order(
  text, text, text, text, text, text, text, text, text, text, uuid, numeric
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_guest_order(
  text, text, text, text, text, text, text, text, text, text, uuid, numeric
) TO anon, authenticated;

-- Make payment confirmation idempotent and reject cancelled/malformed orders.
CREATE OR REPLACE FUNCTION public.confirm_order_payment(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t text;
  current_status text;
  current_payment_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT status, payment_status
  INTO current_status, current_payment_status
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be paid';
  END IF;
  IF current_payment_status = 'paid' THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.order_items WHERE order_id = _order_id
  ) THEN
    RAISE EXCEPTION 'Order has no items';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.paintings p ON p.id = oi.painting_id
    WHERE oi.order_id = _order_id
      AND (p.id IS NULL OR p.status <> 'available')
  ) THEN
    RAISE EXCEPTION 'The artwork is no longer available';
  END IF;

  UPDATE public.orders
  SET payment_status = 'paid',
      status = CASE
        WHEN status = 'pending_confirmation' THEN 'confirmed'
        ELSE status
      END
  WHERE id = _order_id;

  UPDATE public.paintings p
  SET status = 'sold'
  FROM public.order_items oi
  WHERE oi.order_id = _order_id
    AND oi.painting_id = p.id;

  SELECT string_agg(painting_title_snapshot, ', ')
  INTO t
  FROM public.order_items
  WHERE order_id = _order_id;

  INSERT INTO public.notifications (type, title, message, link)
  VALUES (
    'payment',
    'Payment Received',
    'Payment received for ' || COALESCE(t, 'an order') || '.',
    '/admin/orders'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_order_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid) TO authenticated;

-- Public tracking returns no customer data. The random order code prevents
-- practical enumeration, and this length guard rejects unbounded input.
CREATE OR REPLACE FUNCTION public.track_order(_order_number text)
RETURNS TABLE(
  order_number text,
  status text,
  payment_status text,
  created_at timestamptz,
  updated_at timestamptz,
  items text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_number,
    o.status,
    o.payment_status,
    o.created_at,
    o.updated_at,
    (
      SELECT string_agg(oi.painting_title_snapshot, ', ')
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  FROM public.orders o
  WHERE _order_number IS NOT NULL
    AND length(btrim(_order_number)) BETWEEN 4 AND 80
    AND upper(o.order_number) = upper(btrim(_order_number))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;

-- Centralize contact validation and generate an admin notification. Direct
-- anonymous table inserts are removed below.
CREATE OR REPLACE FUNCTION public.notify_new_contact_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, link)
  VALUES (
    'message',
    'New Contact Message',
    NEW.full_name || ' sent a message.',
    '/admin/messages'
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_new_contact_message() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS contact_messages_notify ON public.contact_messages;
CREATE TRIGGER contact_messages_notify
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_contact_message();

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  _full_name text,
  _email text,
  _phone text,
  _message text,
  _website text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(btrim(_website), '') <> '' THEN
    RAISE EXCEPTION 'Invalid submission';
  END IF;
  IF _full_name IS NULL OR length(btrim(_full_name)) < 2 OR length(btrim(_full_name)) > 120 THEN
    RAISE EXCEPTION 'Please enter your name';
  END IF;
  IF _message IS NULL OR length(btrim(_message)) < 5 OR length(btrim(_message)) > 1500 THEN
    RAISE EXCEPTION 'Please enter a valid message';
  END IF;
  IF _email IS NOT NULL AND length(btrim(_email)) > 200 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _email IS NOT NULL AND btrim(_email) <> ''
     AND btrim(_email) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _phone IS NOT NULL AND length(btrim(_phone)) > 40 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF (
    _email IS NOT NULL
    AND btrim(_email) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.contact_messages
      WHERE lower(email) = lower(btrim(_email))
        AND created_at > now() - interval '1 minute'
    )
  ) OR (
    _phone IS NOT NULL
    AND btrim(_phone) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.contact_messages
      WHERE phone = btrim(_phone)
        AND created_at > now() - interval '1 minute'
    )
  ) THEN
    RAISE EXCEPTION 'Please wait a moment before sending another message';
  END IF;

  INSERT INTO public.contact_messages (full_name, email, phone, message)
  VALUES (
    btrim(_full_name),
    NULLIF(btrim(COALESCE(_email, '')), ''),
    NULLIF(btrim(COALESCE(_phone, '')), ''),
    btrim(_message)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text, text) TO anon, authenticated;
DROP POLICY IF EXISTS "contact public insert" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;

-- Commission rows must also be created through the validated RPC. This closes
-- the direct table-write path left by the original public policy.
DROP POLICY IF EXISTS "custom public insert" ON public.custom_requests;
REVOKE INSERT ON public.custom_requests FROM anon, authenticated;

-- Add a honeypot and stricter length checks to commission submissions.
DROP FUNCTION IF EXISTS public.submit_custom_request(text, text, text, text, text, text, date);

CREATE OR REPLACE FUNCTION public.submit_custom_request(
  _name text,
  _whatsapp text,
  _email text,
  _idea text,
  _preferred_size text,
  _budget text,
  _deadline date,
  _website text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rid uuid;
BEGIN
  IF COALESCE(btrim(_website), '') <> '' THEN
    RAISE EXCEPTION 'Invalid submission';
  END IF;
  IF _name IS NULL OR length(btrim(_name)) < 2 OR length(btrim(_name)) > 120 THEN
    RAISE EXCEPTION 'Please enter your name';
  END IF;
  IF _idea IS NULL OR length(btrim(_idea)) < 10 OR length(btrim(_idea)) > 2000 THEN
    RAISE EXCEPTION 'Please describe your idea in a little more detail';
  END IF;
  IF _whatsapp IS NULL OR length(btrim(_whatsapp)) < 7 OR length(btrim(_whatsapp)) > 40 THEN
    RAISE EXCEPTION 'Please enter a valid WhatsApp number';
  END IF;
  IF _email IS NOT NULL AND length(btrim(_email)) > 200 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _email IS NOT NULL AND btrim(_email) <> ''
     AND btrim(_email) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _preferred_size IS NOT NULL AND length(btrim(_preferred_size)) > 120
     OR _budget IS NOT NULL AND length(btrim(_budget)) > 120 THEN
    RAISE EXCEPTION 'One or more fields are too long';
  END IF;
  IF _deadline IS NOT NULL AND _deadline < current_date THEN
    RAISE EXCEPTION 'Please choose a future deadline';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.custom_requests
    WHERE whatsapp = btrim(_whatsapp)
      AND created_at > now() - interval '1 minute'
  ) THEN
    RAISE EXCEPTION 'Please wait a moment before sending another request';
  END IF;

  INSERT INTO public.custom_requests (
    name, whatsapp, email, idea, preferred_size, budget, deadline, status
  )
  VALUES (
    btrim(_name),
    btrim(_whatsapp),
    NULLIF(btrim(COALESCE(_email, '')), ''),
    btrim(_idea),
    NULLIF(btrim(COALESCE(_preferred_size, '')), ''),
    NULLIF(btrim(COALESCE(_budget, '')), ''),
    _deadline,
    'new'
  )
  RETURNING id INTO rid;

  RETURN rid;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_custom_request(
  text, text, text, text, text, text, date, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_custom_request(
  text, text, text, text, text, text, date, text
) TO anon, authenticated;

-- Match the browser's accepted image formats to the storage policy.
DROP POLICY IF EXISTS "custom images public insert" ON public.custom_request_images;
REVOKE INSERT ON public.custom_request_images FROM anon, authenticated;
DROP POLICY IF EXISTS "custom refs public insert" ON storage.objects;
CREATE POLICY "custom refs public insert"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'custom-request-images'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif')
  AND public.can_attach_custom_request_file(name)
);

CREATE INDEX IF NOT EXISTS order_items_painting_id_idx
  ON public.order_items (painting_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS custom_requests_created_at_idx
  ON public.custom_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_email_created_at_idx
  ON public.contact_messages (lower(email), created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_phone_created_at_idx
  ON public.contact_messages (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS custom_requests_whatsapp_created_at_idx
  ON public.custom_requests (whatsapp, created_at DESC);
