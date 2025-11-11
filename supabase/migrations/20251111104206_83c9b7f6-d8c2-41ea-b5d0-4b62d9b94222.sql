-- Remove foreign key constraint to allow free text group_id values
-- This aligns with how Edge Functions write to chat_messages
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_group_id_fkey;