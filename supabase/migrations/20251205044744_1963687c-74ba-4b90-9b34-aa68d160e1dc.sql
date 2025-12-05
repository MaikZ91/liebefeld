-- Create function to post welcome message to chat
CREATE OR REPLACE FUNCTION public.trigger_welcome_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert welcome message into bi_ausgehen chat
  INSERT INTO chat_messages (
    group_id,
    sender,
    text,
    avatar,
    created_at
  ) VALUES (
    'bi_ausgehen',
    'MIA',
    '👋 Willkommen ' || NEW.username || '! Schön, dass du dabei bist. Stell dich gerne vor und erzähl uns, was dich interessiert! 🎉',
    '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
    NOW()
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for welcome chat message
DROP TRIGGER IF EXISTS on_new_user_welcome_chat ON public.user_profiles;
CREATE TRIGGER on_new_user_welcome_chat
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_chat_message();