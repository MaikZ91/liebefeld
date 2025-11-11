-- Add meetup_responses field to chat_messages for tracking "bin dabei" and "diesmal nicht" responses
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS meetup_responses jsonb DEFAULT '{}'::jsonb;