-- painting images: public read, admin write
CREATE POLICY "painting images public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'painting-images');
CREATE POLICY "painting images admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'painting-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "painting images admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'painting-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "painting images admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'painting-images' AND public.has_role(auth.uid(), 'admin'));

-- artist assets: public read, admin write
CREATE POLICY "artist assets public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'artist-assets');
CREATE POLICY "artist assets admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'artist-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "artist assets admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'artist-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "artist assets admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'artist-assets' AND public.has_role(auth.uid(), 'admin'));

-- custom request references: anyone may upload, only admin may read/delete
CREATE POLICY "custom refs public insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'custom-request-images');
CREATE POLICY "custom refs admin read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'custom-request-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "custom refs admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'custom-request-images' AND public.has_role(auth.uid(), 'admin'));

-- internal trigger helpers should not be callable through the API
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_guard_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_artwork_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_order() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_custom_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;