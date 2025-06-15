
-- 1. RLS-Status explizit aktivieren (falls nicht aktiv)
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- 2. Grant-Tabellenberechtigungen sicherstellen
GRANT UPDATE ON public.community_events TO anon;
GRANT UPDATE ON public.community_events TO authenticated;

-- 3. Bestehende UPDATE-Policies entfernen, damit es keine Überschneidungen gibt
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Events bearbeiten" ON public.community_events;
DROP POLICY IF EXISTS "Allow public updates for likes" ON public.community_events;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.community_events;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.community_events;
DROP POLICY IF EXISTS "Allow anyone to update events (for likes)" ON public.community_events;

-- 4. Neue, eindeutige UPDATE-Policy setzen (alle dürfen updaten)
CREATE POLICY "Allow anyone to update events (for likes)" 
  ON public.community_events
  FOR UPDATE
  USING (true);

-- Optional: Review alle Policies für diese Tabelle
-- SELECT * FROM pg_policies WHERE tablename = 'community_events';

-- Kurzfassung: Danach dürfen alle (auch Anonyme!) UPDATEs auf community_events ausführen. 
