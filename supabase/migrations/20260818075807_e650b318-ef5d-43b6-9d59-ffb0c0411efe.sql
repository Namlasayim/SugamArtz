-- 1. Guest order placement via a single validated server-side function
CREATE OR REPLACE FUNCTION public.place_guest_order(
  _name text, _phone text, _whatsapp text, _email text,
  _province text, _district text, _municipality text, _address text,
  _landmark text, _instructions text,
  _painting_id uuid, _delivery_fee numeric
)
RETURNS TABLE(order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cid uuid; aid uuid; oid uuid; onum text;
  p record; fee numeric; sub numeric;
BEGIN
  IF _name IS NULL OR btrim(_name) = '' OR length(_name) > 120 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  IF _phone IS NULL OR btrim(_phone) = '' OR length(_phone) > 40 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF _email IS NOT NULL AND length(_email) > 200 THEN RAISE EXCEPTION 'Invalid email'; END IF;

  SELECT id, title, price, artwork_id, status INTO p
  FROM public.paintings WHERE id = _painting_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Painting not found'; END IF;
  IF p.status <> 'available' THEN RAISE EXCEPTION 'Painting is not available'; END IF;

  SELECT COALESCE(delivery_fee, 0) INTO fee FROM public.artist_settings WHERE id = 1;
  fee := COALESCE(fee, 0);
  sub := p.price;

  INSERT INTO public.customers (name, email, phone, whatsapp)
  VALUES (btrim(_name), NULLIF(btrim(COALESCE(_email,'')),''), btrim(_phone),
          NULLIF(btrim(COALESCE(_whatsapp,'')),''))
  RETURNING id INTO cid;

  INSERT INTO public.addresses (customer_id, province, district, municipality, address, landmark, instructions)
  VALUES (cid, NULLIF(btrim(COALESCE(_province,'')),''), NULLIF(btrim(COALESCE(_district,'')),''),
          NULLIF(btrim(COALESCE(_municipality,'')),''), NULLIF(btrim(COALESCE(_address,'')),''),
          NULLIF(btrim(COALESCE(_landmark,'')),''), NULLIF(btrim(COALESCE(_instructions,'')),''))
  RETURNING id INTO aid;

  INSERT INTO public.orders (order_number, customer_id, address_id, status, payment_status, subtotal, delivery_fee, total)
  VALUES ('pending', cid, aid, 'pending_confirmation', 'pending', sub, fee, sub + fee)
  RETURNING id, orders.order_number INTO oid, onum;

  INSERT INTO public.order_items (order_id, painting_id, painting_title_snapshot, painting_price_snapshot, artwork_id_snapshot)
  VALUES (oid, p.id, p.title, p.price, p.artwork_id);

  RETURN QUERY SELECT onum;
END; $$;

REVOKE ALL ON FUNCTION public.place_guest_order(text,text,text,text,text,text,text,text,text,text,uuid,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_guest_order(text,text,text,text,text,text,text,text,text,text,uuid,numeric) TO anon, authenticated;

-- 2. Remove unrestricted public writes
DROP POLICY IF EXISTS "addresses public insert" ON public.addresses;
DROP POLICY IF EXISTS "orders public insert" ON public.orders;
DROP POLICY IF EXISTS "order items public insert" ON public.order_items;
DROP POLICY IF EXISTS "customers public insert" ON public.customers;
REVOKE INSERT ON public.addresses FROM anon, authenticated;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;
REVOKE INSERT ON public.customers FROM anon, authenticated;

-- 3. Custom request images: only via validated function, recent request only
DROP POLICY IF EXISTS "custom images public insert" ON public.custom_request_images;
REVOKE INSERT ON public.custom_request_images FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_custom_request_image(_request_id uuid, _storage_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _storage_path IS NULL OR btrim(_storage_path) = '' OR length(_storage_path) > 400 THEN
    RAISE EXCEPTION 'Invalid path';
  END IF;
  IF _storage_path NOT LIKE (_request_id::text || '/%') THEN
    RAISE EXCEPTION 'Path does not belong to this request';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.custom_requests
    WHERE id = _request_id AND status = 'new' AND created_at > now() - interval '30 minutes'
  ) THEN
    RAISE EXCEPTION 'Request not open for attachments';
  END IF;
  IF (SELECT count(*) FROM public.custom_request_images WHERE request_id = _request_id) >= 5 THEN
    RAISE EXCEPTION 'Too many images';
  END IF;
  INSERT INTO public.custom_request_images (request_id, storage_path) VALUES (_request_id, _storage_path);
END; $$;

REVOKE ALL ON FUNCTION public.add_custom_request_image(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_custom_request_image(uuid, text) TO anon, authenticated;

-- 4. Prevent self role escalation on profiles (column-level grants + existing trigger)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, avatar_url, updated_at) ON public.profiles TO authenticated;
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (user_id, name, avatar_url) ON public.profiles TO authenticated;

-- 5. Lock down internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_custom_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_order() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_guard_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_artwork_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.confirm_order_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.track_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;