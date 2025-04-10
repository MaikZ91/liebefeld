
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chatTypes';

export const useMessageSubscription = (
  groupId: string,
  onNewMessage: (message: Message) => void,
  onForceRefresh: () => void
) => {
  useEffect(() => {
    if (!groupId) {
      console.log('No group ID, skipping subscription');
      return;
    }
    
    console.log(`Setting up subscription for group: ${groupId}`);

    // Explicitly add the table to the realtime publication when subscribing
    const enableRealtimeTable = async () => {
      const { data, error } = await supabase.rpc('enable_realtime_for_table', {
        table_name: 'chat_messages'
      } as { table_name: string });
      
      if (error) {
        console.error('Error enabling realtime:', error);
      } else {
        console.log('Realtime enabled result:', data);
      }
    };
    
    enableRealtimeTable();

    const channel = supabase
      .channel(`group_chat:${groupId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        if (payload.new && payload.eventType === 'INSERT') {
          const newPayload = payload.new as any;
          if (newPayload && newPayload.group_id === groupId) {            
            const newMsg: Message = {
              id: newPayload.id,
              created_at: newPayload.created_at,
              content: newPayload.text,
              user_name: newPayload.sender,
              user_avatar: newPayload.avatar || '',
              group_id: newPayload.group_id,
            };
            
            console.log('New message received via subscription:', newMsg);
            onNewMessage(newMsg);
          }
        }
      })
      .on('broadcast', { event: 'force_refresh' }, (payload) => {
        console.log('Force refresh triggered:', payload);
        onForceRefresh();
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log(`Unsubscribing from group: ${groupId}`);
      channel.unsubscribe();
    };
  }, [groupId, onNewMessage, onForceRefresh]);
};
