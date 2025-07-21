-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to send weekly MIA message every Sunday at 8 AM
SELECT cron.schedule(
  'weekly-mia-message',
  '0 8 * * 0', -- Every Sunday at 8:00 AM (0 = Sunday)
  $$
  SELECT
    net.http_post(
        url:='https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/weekly-mia-message',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);