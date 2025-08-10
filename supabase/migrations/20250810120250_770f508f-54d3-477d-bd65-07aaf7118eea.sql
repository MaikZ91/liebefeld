-- Create or replace trigger function to send push notifications when a new reaction is added
CREATE OR REPLACE FUNCTION public.trigger_reaction_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_pairs TEXT[];
  new_pairs TEXT[];
  added_pair TEXT;
  added_user TEXT;
  added_emoji TEXT;
  preview TEXT;
  notify_text TEXT;
  function_url TEXT;
BEGIN
  -- Build pairs of emoji|username for OLD and NEW reactions
  old_pairs := ARRAY(
    SELECT (r->>'emoji') || '|' || u
    FROM jsonb_array_elements(COALESCE(OLD.reactions, '[]'::jsonb)) r,
         jsonb_array_elements_text(COALESCE(r->'users', '[]'::jsonb)) AS u
  );

  new_pairs := ARRAY(
    SELECT (r->>'emoji') || '|' || u
    FROM jsonb_array_elements(COALESCE(NEW.reactions, '[]'::jsonb)) r,
         jsonb_array_elements_text(COALESCE(r->'users', '[]'::jsonb)) AS u
  );

  -- Find at least one newly added pair
  SELECT p INTO added_pair
  FROM unnest(new_pairs) p
  EXCEPT
  SELECT p FROM unnest(old_pairs) p
  LIMIT 1;

  -- If nothing new was added, exit
  IF added_pair IS NULL THEN
    RETURN NEW;
  END IF;

  added_emoji := split_part(added_pair, '|', 1);
  added_user  := split_part(added_pair, '|', 2);

  -- Create a short preview of the original message text
  preview := COALESCE(LEFT(REPLACE(COALESCE(NEW.text, ''), E'\n', ' '), 80), '');

  notify_text := added_user || ' reagierte mit ' || added_emoji || ' auf die Nachricht von '
                  || COALESCE(NEW.sender, 'jemand')
                  || CASE WHEN preview <> '' THEN ': "' || preview || '..."' ELSE '' END;

  -- Edge function URL
  function_url := 'https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/send-push';

  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo'
    ),
    body := jsonb_build_object(
      'sender', added_user,
      'text', notify_text,
      'message_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger to run after updates to the reactions column
DROP TRIGGER IF EXISTS on_reaction_push_notification ON public.chat_messages;
CREATE TRIGGER on_reaction_push_notification
AFTER UPDATE OF reactions ON public.chat_messages
FOR EACH ROW
WHEN (NEW.reactions IS DISTINCT FROM OLD.reactions)
EXECUTE FUNCTION public.trigger_reaction_push_notification();