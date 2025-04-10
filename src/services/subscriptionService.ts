
import { supabase } from '@/integrations/supabase/client';
import { Message, TypingUser } from '@/types/chatTypes';

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
    console.log(`Creating message subscription for group ${groupId}`);
    
    // Set up a subscription for real-time message updates
    const messageChannel = supabase
      .channel(`group_chat:${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Received message via postgres changes:', payload);
        if (payload.new) {
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

    // Set up a subscription to monitor table changes directly
    const tableChangesChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        console.log('Table INSERT received:', payload);
        if (payload.new && (payload.new as any).group_id === groupId) {
          const newMsg: Message = {
            id: (payload.new as any).id,
            created_at: (payload.new as any).created_at,
            content: (payload.new as any).text,
            user_name: (payload.new as any).sender,
            user_avatar: (payload.new as any).avatar || '',
            group_id: (payload.new as any).group_id,
          };
          
          console.log('Inserted message via table changes:', newMsg);
          onNewMessage(newMsg);
        }
      })
      .subscribe();

    return [messageChannel, tableChangesChannel];
  },

  /**
   * Create typing indicator subscription
   */
  createTypingSubscription(
    groupId: string,
    username: string,
    onTypingUpdate: (users: TypingUser[]) => void
  ) {
    console.log(`Creating typing subscription for group ${groupId}`);
    
    const typingChannel = supabase
      .channel(`typing:${groupId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing status update received:', payload);
        
        if (payload.payload && payload.payload.username !== username) {
          const { username: typingUsername, avatar, isTyping } = payload.payload;
          
          onTypingUpdate([{
            username: typingUsername,
            avatar: avatar,
            lastTyped: isTyping ? new Date() : null
          }]);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status for typing:', status);
      });
      
    return typingChannel;
  }
};
