
-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily top events post at 8:00 UTC (= 9:00 CET)
SELECT cron.schedule(
  'daily-top-events-9am',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/daily-top-event-message',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
