
INSERT INTO public.paintings (artwork_code, title, price, medium, dimensions, year, category, description, story, images, availability, featured, sort_order) VALUES
('AS-001','Dawn Over Annapurna', 185000, 'Oil on canvas', '36 x 26 in', 2025, 'Landscape',
 'First light striking the Annapurna range, painted from a ridge above Ghandruk.',
 'I walked three hours in the dark to reach this ridge. When the first light hit the snow it lasted only four minutes — the rest of the painting is memory and longing.',
 ARRAY['/artwork/dawn-over-annapurna.jpg'], 'available', true, 1),
('AS-002','Newari Courtyard', 142000, 'Oil on linen', '24 x 32 in', 2024, 'Heritage',
 'A quiet chowk in Patan, its carved windows holding the afternoon.',
 'This courtyard belonged to my grandmother''s neighbours. Painting it was a way of keeping the woodwork alive after the earthquake took half the block.',
 ARRAY['/artwork/newari-courtyard.jpg'], 'available', true, 2),
('AS-003','Grandmother of Patan', 168000, 'Oil on canvas', '24 x 32 in', 2024, 'Portrait',
 'A portrait of Hira Maya, ninety-one, with her mala.',
 'She sat for me for six mornings and told a different story each time. The gold ground is for the light she carried.',
 ARRAY['/artwork/grandmother-of-patan.jpg'], 'sold', false, 3),
('AS-004','Prayer Wind', 96000, 'Acrylic on canvas', '34 x 26 in', 2025, 'Abstract',
 'Prayer flags reduced to colour, weight and wind.',
 'An attempt to paint sound: the constant snap of lungta above a high pass.',
 ARRAY['/artwork/prayer-wind.jpg'], 'available', true, 4),
('AS-005','Lamps at Boudha', 210000, 'Oil on canvas', '34 x 26 in', 2023, 'Heritage',
 'Butter lamps circling the great stupa at dusk.',
 'Painted over two winters. Every lamp in the foreground is one I lit myself.',
 ARRAY['/artwork/lamps-at-boudha.jpg'], 'sold', false, 5),
('AS-006','Terraces in Monsoon', 124000, 'Oil on canvas', '36 x 26 in', 2025, 'Landscape',
 'Flooded terraces near Nuwakot under moving cloud.',
 'The fields become mirrors for two weeks a year. I paint them wet, fast, before the light changes.',
 ARRAY['/artwork/terraces-in-monsoon.jpg'], 'available', false, 6),
('AS-007','Offering', 78000, 'Oil on panel', '20 x 20 in', 2024, 'Still Life',
 'Brass, marigold and vermilion on the family altar.',
 'A small painting about repetition — the same objects, arranged the same way, every morning of my childhood.',
 ARRAY['/artwork/offering.jpg'], 'available', false, 7);

UPDATE public.site_settings SET hero_image = '/artwork/dawn-over-annapurna.jpg' WHERE id = 1;

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
