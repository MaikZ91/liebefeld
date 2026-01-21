-- Alten Cron-Job entfernen und neuen für Mittwoch 9 Uhr erstellen
SELECT cron.unschedule('post-weekly-meetup-message-mon');

-- Neuer Cron-Job: Jeden Mittwoch um 8:00 UTC (= 9:00 Uhr deutsche Zeit)
SELECT cron.schedule(
  'weekly-stammtisch-community-board',
  '0 8 * * 3',
  $$
  SELECT net.http_post(
    url:='https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/post-weekly-meetup-message',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);