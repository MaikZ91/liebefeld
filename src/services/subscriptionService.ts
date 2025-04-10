
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chatTypes';
import { messageService } from './messageService';

/**
 * Service for real-time subscription operations
 */
export const subscriptionService = {
  /**
   * Create channel subscriptions for real-time updates
   */
  createMessageSubscription(
    groupId: string, 
    onNewMessage: (message: Message) => void,
    onForceRefresh: () => void,
    username: string
  ) {
    const messageChannel = supabase
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
        console.log('Subscription status for messages:', status);
      });

    return messageChannel;
  }
};
