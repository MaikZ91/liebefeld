
-- Entferne ALLE existierenden UPDATE-Policies auf community_events
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Events bearbeiten" ON public.community_events;
DROP POLICY IF EXISTS "Allow public updates for likes" ON public.community_events;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.community_events;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.community_events;

-- Setze EINE klare Policy: Jeder darf UPDATE auf community_events durchführen (für Likes)
CREATE POLICY "Allow anyone to update events (for likes)" ON public.community_events
  FOR UPDATE
  USING (true);

-- (Optional, falls noch andere UPDATE-Policies existieren)
-- Liste alle Policies zur Kontrolle:
-- SELECT * FROM pg_policies WHERE tablename = 'community_events';

-- Hinweis: Mit dieser Policy dürfen alle UPDATEs durchführen (d.h. auch Likes ohne Login persistieren).
