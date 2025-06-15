
-- Entferne die Policy, die nur Bearbeiten für eigene Events erlaubt
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Events bearbeiten" ON public.community_events;

-- Prüfe, dass weiterhin PUBLIC Updates für Likes möglich sind (diese Policy bleibt bestehen)
-- Falls mehrfach vorhanden, lösche unnötige Policies, aber lasse folgende Policy aktiv:

-- Erlaubt PUBLIC, Events zu updaten (z.B. Likes hochzuzählen)
-- CREATE POLICY "Allow public updates for likes" ON public.community_events
--   FOR UPDATE
--   USING (true);

-- Optional: ggf. weitere Policies prüfen und bereinigen, damit keine Kontrolle über genauen Bearbeiter mehr stattfindet, sondern PUBLIC-Update möglich ist.

