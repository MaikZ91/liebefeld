
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chatTypes';

export const useMessageFetching = (groupId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      console.log(`Fetching messages for group: ${groupId}`);
      
      // First, enable realtime for the table
      const { data: enableResult, error: enableError } = await supabase.rpc('enable_realtime_for_table', {
        table_name: 'chat_messages'
      } as any);
      
      if (enableError) {
        console.error('Error enabling realtime:', enableError);
      } else {
        console.log('Realtime enabled result:', enableResult);
      }
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setError(error.message);
        return [];
      } else {
        console.log(`Received ${data?.length || 0} messages for group ${groupId}`);
        const formattedMessages: Message[] = (data || []).map(msg => ({
          id: msg.id,
          created_at: msg.created_at,
          content: msg.text,
          user_name: msg.sender,
          user_avatar: msg.avatar || '',
          group_id: msg.group_id,
        }));
        
        setError(null);
        return formattedMessages;
      }
    } catch (err: any) {
      console.error('Error in fetchMessages:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchMessages,
    loading,
    error,
    setError
  };
};
