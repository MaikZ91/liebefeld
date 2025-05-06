
-- Funktion erstellen, die überprüft, ob die richtigen RLS-Policies vorhanden sind
CREATE OR REPLACE FUNCTION public.ensure_avatar_policies()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sicherstellen, dass der avatars-Bucket öffentlichen Zugriff hat
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
  
  -- Policy für öffentliche Lesezugriffe
  BEGIN
    CREATE POLICY "Public Read Access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  EXCEPTION WHEN duplicate_object THEN
    -- Policy existiert bereits
  END;
  
  -- Policy für öffentliche Schreibzugriffe
  BEGIN
    CREATE POLICY "Public Insert Access"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars');
  EXCEPTION WHEN duplicate_object THEN
    -- Policy existiert bereits
  END;

  -- Policy für öffentliche Aktualisierungen
  BEGIN
    CREATE POLICY "Public Update Access"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars');
  EXCEPTION WHEN duplicate_object THEN
    -- Policy existiert bereits
  END;

  -- Erfolgsmeldung zurückgeben
  RETURN json_build_object('success', true);
END;
$$;
