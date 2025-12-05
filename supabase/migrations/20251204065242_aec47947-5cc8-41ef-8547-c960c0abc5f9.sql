-- Create function to trigger welcome push notification for new users
CREATE OR REPLACE FUNCTION public.trigger_welcome_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
BEGIN
  -- Construct the edge function URL
  function_url := 'https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/send-push';
  
  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo'
    ),
    body := jsonb_build_object(
      'sender', 'THE TRIBE',
      'text', '👋 ' || NEW.username || ' ist jetzt Teil der Community!',
      'message_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires when a new user profile is inserted
DROP TRIGGER IF EXISTS on_new_user_welcome_push ON public.user_profiles;
CREATE TRIGGER on_new_user_welcome_push
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_push_notification();