
import { supabase } from '@/integrations/supabase/client';
import { TypingUser } from '@/types/chatTypes';

/**
 * Service for typing indicator operations
 */
export const typingService = {
  /**
   * Send typing status to other clients
   */
  sendTypingStatus(
    groupId: string,
    username: string,
    avatar: string | null,
    isTyping: boolean
  ): Promise<boolean> {
    console.log(`Sending typing status ${isTyping ? 'started' : 'stopped'} for ${username} in group ${groupId}`);
    
    try {
      // Get typing channel
      const channel = supabase.channel(`typing:${groupId}`);
      
      // Send typing status
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          username,
          avatar,
          isTyping
        }
      });
      
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error sending typing status:', error);
      return Promise.resolve(false);
    }
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
