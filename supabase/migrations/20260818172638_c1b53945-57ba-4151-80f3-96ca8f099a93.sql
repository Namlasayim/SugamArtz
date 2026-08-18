ALTER TABLE public.artist_settings
  DROP CONSTRAINT IF EXISTS artist_settings_bio_length;

ALTER TABLE public.artist_settings
  ADD CONSTRAINT artist_settings_bio_length
  CHECK (bio IS NULL OR length(bio) <= 3000);
