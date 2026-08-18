CREATE OR REPLACE FUNCTION public.submit_custom_request(
  _name text, _whatsapp text, _email text, _idea text,
  _preferred_size text, _budget text, _deadline date
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE rid uuid;
BEGIN
  IF _name IS NULL OR btrim(_name) = '' OR length(_name) > 120 THEN
    RAISE EXCEPTION 'Please enter your name';
  END IF;
  IF _idea IS NULL OR length(btrim(_idea)) < 10 OR length(_idea) > 2000 THEN
    RAISE EXCEPTION 'Please describe your idea in a little more detail';
  END IF;
  IF _whatsapp IS NULL OR length(btrim(_whatsapp)) < 7 OR length(_whatsapp) > 40 THEN
    RAISE EXCEPTION 'Please enter a valid WhatsApp number';
  END IF;
  IF _email IS NOT NULL AND length(_email) > 200 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  INSERT INTO public.custom_requests (name, whatsapp, email, idea, preferred_size, budget, deadline, status)
  VALUES (
    btrim(_name),
    btrim(_whatsapp),
    NULLIF(btrim(COALESCE(_email,'')),''),
    btrim(_idea),
    NULLIF(btrim(COALESCE(_preferred_size,'')),''),
    NULLIF(btrim(COALESCE(_budget,'')),''),
    _deadline,
    'new'
  )
  RETURNING id INTO rid;

  RETURN rid;
END; $$;

REVOKE ALL ON FUNCTION public.submit_custom_request(text, text, text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_custom_request(text, text, text, text, text, text, date) TO anon, authenticated;