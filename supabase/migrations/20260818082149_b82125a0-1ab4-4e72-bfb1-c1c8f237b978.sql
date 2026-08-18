
-- 1) Profiles: prevent self-assignment of role
DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

CREATE POLICY "profiles insert own"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role)
                  THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
);

CREATE POLICY "profiles update own"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role)
                  THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
);

-- 2) Storage: restrict commission reference uploads
CREATE OR REPLACE FUNCTION public.can_attach_custom_request_file(_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE rid uuid; folder text;
BEGIN
  IF _path IS NULL OR position('/' in _path) = 0 OR length(_path) > 400 THEN
    RETURN false;
  END IF;
  folder := split_part(_path, '/', 1);
  -- only one level of nesting allowed: <request_id>/<file>
  IF array_length(string_to_array(_path, '/'), 1) <> 2 THEN
    RETURN false;
  END IF;
  BEGIN
    rid := folder::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  IF NOT EXISTS (
    SELECT 1 FROM public.custom_requests
    WHERE id = rid AND status = 'new' AND created_at > now() - interval '30 minutes'
  ) THEN
    RETURN false;
  END IF;
  IF (SELECT count(*) FROM storage.objects
      WHERE bucket_id = 'custom-request-images'
        AND name LIKE (rid::text || '/%')) >= 5 THEN
    RETURN false;
  END IF;
  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.can_attach_custom_request_file(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_attach_custom_request_file(text) TO anon, authenticated;

DROP POLICY IF EXISTS "custom refs public insert" ON storage.objects;
CREATE POLICY "custom refs public insert"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'custom-request-images'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','heic','gif')
  AND public.can_attach_custom_request_file(name)
);
