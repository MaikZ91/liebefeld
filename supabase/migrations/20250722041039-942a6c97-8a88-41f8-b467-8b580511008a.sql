-- Trigger-Funktion für Reaktionen auf Nachrichten
CREATE OR REPLACE FUNCTION public.trigger_reaction_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  function_url text;
  old_reactions_count int;
  new_reactions_count int;
BEGIN
  -- Zähle die Anzahl der Reaktionen vorher und nachher
  old_reactions_count := COALESCE(jsonb_array_length(OLD.reactions), 0);
  new_reactions_count := COALESCE(jsonb_array_length(NEW.reactions), 0);
  
  -- Nur senden wenn neue Reaktionen hinzugefügt wurden (nicht entfernt)
  IF new_reactions_count > old_reactions_count THEN
    -- Edge Function URL konstruieren
    function_url := 'https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/send-push';
    
    -- Edge Function asynchron aufrufen
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo'
      ),
      body := jsonb_build_object(
        'type', 'reaction',
        'sender', 'Jemand',
        'text', 'hat auf deine Nachricht reagiert: "' || LEFT(NEW.text, 50) || '"',
        'message_id', NEW.id,
        'original_sender', NEW.sender,
        'reaction_count', new_reactions_count
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$

-- Trigger für Reaktionen auf chat_messages
CREATE TRIGGER trigger_reaction_notification
  AFTER UPDATE OF reactions ON public.chat_messages
  FOR EACH ROW
  WHEN (OLD.reactions IS DISTINCT FROM NEW.reactions)
  EXECUTE FUNCTION public.trigger_reaction_push_notification();