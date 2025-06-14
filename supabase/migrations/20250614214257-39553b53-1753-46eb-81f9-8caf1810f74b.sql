
-- Erweitere community_events Tabelle um GitHub-spezifische Felder
ALTER TABLE community_events 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'community',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Index für bessere Performance bei GitHub Events
CREATE INDEX IF NOT EXISTS idx_community_events_source ON community_events(source);
CREATE INDEX IF NOT EXISTS idx_community_events_external_id ON community_events(external_id);

-- Unique constraint für GitHub Events (verhindert Duplikate)
ALTER TABLE community_events 
ADD CONSTRAINT unique_github_event UNIQUE (source, external_id);

-- Aktiviere pg_cron Extension für Cron Jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Lösche alte github_event_likes Tabelle (nicht mehr benötigt)
DROP TABLE IF EXISTS github_event_likes CASCADE;

-- Cron Job für stündliche GitHub Event Synchronisation
SELECT cron.schedule(
  'sync-github-events-hourly',
  '0 * * * *', -- Jede Stunde zur vollen Stunde
  $$
  SELECT net.http_post(
    url:='https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/sync-github-events',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);
