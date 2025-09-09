-- Add reply functionality to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN reply_to_message_id UUID REFERENCES chat_messages(id),
ADD COLUMN reply_to_sender TEXT,
ADD COLUMN reply_to_text TEXT;