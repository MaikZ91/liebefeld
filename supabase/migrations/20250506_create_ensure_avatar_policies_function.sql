
-- Funktion erstellen, die überprüft, ob die richtigen RLS-Policies vorhanden sind
CREATE OR REPLACE FUNCTION public.ensure_avatar_policies()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  bucket_exists boolean;
BEGIN
  -- Prüfen, ob der avatars-Bucket existiert
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) INTO bucket_exists;
  
  -- Wenn der Bucket existiert, setzen wir ihn auf öffentlich
  IF bucket_exists THEN
    UPDATE storage.buckets 
    SET public = true 
    WHERE id = 'avatars';
  ELSE
    -- Sicherstellen, dass der avatars-Bucket öffentlichen Zugriff hat
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
  END IF;
  
  -- Policy für öffentliche Lesezugriffe
  BEGIN
    CREATE POLICY "Public Read Access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  EXCEPTION WHEN duplicate_object THEN
    -- Policy existiert bereits
    NULL;
  END;
  
  -- Policy für öffentliche Schreibzugriffe
  BEGIN
    CREATE POLICY "Public Insert Access"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars');
  EXCEPTION WHEN duplicate_object THEN
    -- Policy existiert bereits
    NULL;
  END;

  -- Policy für öffentliche Aktualisierungen
  BEGIN
    CREATE POLICY "Public Update Access"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars');
  EXCEPTION WHEN duplicate_object THEN
    -- Policy existiert bereits
    NULL;
  END;

  -- Erfolgsmeldung zurückgeben
  RETURN json_build_object('success', true);
END;
$$;
