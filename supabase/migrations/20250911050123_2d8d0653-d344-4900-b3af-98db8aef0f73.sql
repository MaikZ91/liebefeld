-- Add column to store whether multiple answers are allowed in polls
ALTER TABLE chat_messages 
ADD COLUMN poll_allow_multiple BOOLEAN DEFAULT false;