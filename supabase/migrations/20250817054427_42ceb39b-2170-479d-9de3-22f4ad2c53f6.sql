-- Add thread support to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN parent_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE;

-- Create index for efficient thread queries
CREATE INDEX idx_chat_messages_parent_id ON chat_messages(parent_id);
CREATE INDEX idx_chat_messages_thread_lookup ON chat_messages(group_id, parent_id, created_at);

-- Add thread count function
CREATE OR REPLACE FUNCTION get_thread_count(message_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM chat_messages 
    WHERE parent_id = message_id
  );
END;
$$ LANGUAGE plpgsql;