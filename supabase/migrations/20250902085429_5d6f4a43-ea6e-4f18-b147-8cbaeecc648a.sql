-- Add poll_votes column to chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN poll_votes JSONB DEFAULT NULL;

-- Add poll_question and poll_options columns for better poll structure
ALTER TABLE public.chat_messages 
ADD COLUMN poll_question TEXT DEFAULT NULL,
ADD COLUMN poll_options JSONB DEFAULT NULL;