
-- Setzt die Stadt für alle GitHub-Events ohne Stadt auf "Bielefeld"
UPDATE public.community_events
SET city = 'Bielefeld'
WHERE source = 'github' AND city IS NULL;
