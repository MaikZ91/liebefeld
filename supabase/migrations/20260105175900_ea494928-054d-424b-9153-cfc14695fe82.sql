-- Update the welcome chat message trigger to only fire for non-guest users
CREATE OR REPLACE FUNCTION public.trigger_welcome_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Skip welcome message for guest users (they haven't completed onboarding yet)
  IF NEW.username LIKE 'Guest_%' THEN
    RETURN NEW;
  END IF;

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
$$;