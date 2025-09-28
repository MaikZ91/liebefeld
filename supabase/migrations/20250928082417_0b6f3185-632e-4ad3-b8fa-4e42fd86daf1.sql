-- Create cron job for weekly sport poll (every Monday at 9:00 AM)
SELECT cron.schedule(
  'weekly-sport-poll-mondays',
  '0 9 * * 1', -- Every Monday at 9:00 AM
  $$
  SELECT net.http_post(
      url:='https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/weekly-sport-poll',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);