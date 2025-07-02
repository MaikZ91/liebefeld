-- Allow public update access to chat_messages for reactions
CREATE POLICY "Allow public update access to chat_messages for reactions" 
ON chat_messages 
FOR UPDATE 
USING (true)
WITH CHECK (true);