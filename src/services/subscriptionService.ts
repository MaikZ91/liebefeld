// src/services/realtimeService.ts
// Changed: 'content' to 'text'
import { supabase } from '@/integrations/supabase/client';
import { Message, TypingUser } from '@/types/chatTypes'; // <-- KORREKTUR: TypingUser hinzugefügt!

/**
 * Service for real-time subscription operations
 */
export const subscriptionService = {
  /**
   * Create channel subscriptions for real-time updates
   * Optimized to reduce unnecessary operations
   */
  createMessageSubscription(
    groupId: string, 
    onNewMessage: (message: Message) => void,
    onForceRefresh: () => void,
    username: string
  ) {
    console.log(`Creating message subscription for group ${groupId}`);
    
    // Set up a subscription for real-time message updates with specific filter
    const messageChannel = supabase
      .channel(`group_chat:${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Received INSERT message via postgres changes (SubscriptionService):', payload);
        if (payload.new) {
          const newPayload = payload.new as any;
          // Only process if this message belongs to our group
          if (newPayload && newPayload.group_id === groupId) {            
            const newMsg: Message = {
              id: newPayload.id,
              created_at: newPayload.created_at,
              text: newPayload.text, // Changed from 'content' to 'text'
              user_name: newPayload.sender,
              user_avatar: newPayload.avatar || '',
              group_id: newPayload.group_id,
            };
            
            console.log('New message received via subscription (SubscriptionService):', newMsg);
            onNewMessage(newMsg);
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Received UPDATE message via postgres changes (SubscriptionService):', payload);
        // For reaction updates, we need to force refresh
        onForceRefresh();
        console.log('onForceRefresh called due to UPDATE event (SubscriptionService)');
      })
      .on('broadcast', { event: 'force_refresh' }, (payload) => {
        console.log('Force refresh triggered (SubscriptionService):', payload);
        onForceRefresh();
      })
      .subscribe((status) => {
        console.log('Subscription status for messages (SubscriptionService):', status);
      });

    // We'll only use the direct table subscription for better performance
    return messageChannel;
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
        console.log('Typing status update received (SubscriptionService):', payload);
        
        if (payload.payload && payload.payload.username !== username) {
          const { username: typingUsername, avatar, isTyping } = payload.payload;
          
          onTypingUpdate([{
            username: typingUsername,
            avatar: avatar,
            isTyping: isTyping,
            lastTyped: isTyping ? new Date() : undefined
          }]);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status for typing (SubscriptionService):', status);
      });
      
    return typingChannel;
  }
};