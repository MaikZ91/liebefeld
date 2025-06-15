
-- Aktiviere Row Level Security (RLS) für die Tabelle, falls noch nicht aktiv
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Erlaube allen Usern PUBLIC, Events zu updaten (z.B. Likes hochzuzählen)
CREATE POLICY "Allow public updates for likes" ON public.community_events
  FOR UPDATE
  USING (true);

-- Optional: Erlaube auch PUBLIC Inserts (z.B. falls du Events ohne Login erstellen willst)
-- CREATE POLICY "Allow public insert" ON public.community_events
--   FOR INSERT
--   WITH CHECK (true);
