
import { supabase } from '@/integrations/supabase/client';
import { TypingUser } from '@/types/chatTypes';

/**
 * Service for handling typing indicators
 */
export const typingService = {
  /**
   * Send typing status to other users
   */
  async sendTypingStatus(
    groupId: string, 
    username: string, 
    avatar: string | null, 
    isTyping: boolean
  ): Promise<boolean> {
    try {
      console.log(`Sending typing status for ${username} in group ${groupId}: ${isTyping ? 'typing' : 'not typing'}`);
      
      const channel = supabase.channel(`typing:${groupId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          username,
          avatar,
          isTyping
        }
      });
      
      // Remove the channel after use to prevent too many open channels
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Error sending typing status:', error);
      return false;
    }
  },

  /**
   * Create a subscription for typing indicators
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
        console.log('Typing event received:', payload);
        
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
