-- Create push_tokens table
CREATE TABLE public.push_tokens (
  token text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public access to push_tokens for inserting and reading
CREATE POLICY "Allow public insert access to push_tokens" 
ON public.push_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to push_tokens" 
ON public.push_tokens 
FOR SELECT 
USING (true);

-- Create trigger function to call send-push edge function
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
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
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo'
    ),
    body := jsonb_build_object(
      'sender', NEW.sender,
      'text', NEW.text,
      'message_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on chat_messages
CREATE TRIGGER trigger_send_push_notification
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();