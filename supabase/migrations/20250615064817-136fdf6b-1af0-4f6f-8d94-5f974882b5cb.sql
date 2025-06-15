
-- Zuerst stellen wir sicher, dass Row Level Security (RLS) für die Event-Tabelle aktiviert ist.
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Wir entfernen alle alten oder widersprüchlichen Policies, um sauber zu starten.
DROP POLICY IF EXISTS "Allow public read access" ON public.community_events;
DROP POLICY IF EXISTS "Allow public updates for likes" ON public.community_events;
DROP POLICY IF EXISTS "Allow anyone to update events (for likes)" ON public.community_events;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Events bearbeiten" ON public.community_events;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.community_events;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.community_events;


-- Eine neue Policy, die es jedem (angemeldet oder nicht) erlaubt, Events zu sehen.
CREATE POLICY "Allow public read access"
ON public.community_events
FOR SELECT
USING (true);

-- Eine neue Policy, die es jedem (angemeldet oder nicht) erlaubt, Events zu aktualisieren.
-- Dies ist notwendig, damit die Like-Funktion für alle Benutzer funktioniert.
CREATE POLICY "Allow public update for likes"
ON public.community_events
FOR UPDATE
USING (true);
