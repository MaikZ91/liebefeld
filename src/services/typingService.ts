
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for typing indicator operations
 */
export const typingService = {
  /**
   * Send typing status for a user
   */
  async sendTypingStatus(groupId: string, username: string, avatar: string | null, isTyping: boolean): Promise<void> {
    try {
      await supabase
        .channel(`typing:${groupId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar,
            isTyping
          }
        });
    } catch (error) {
      console.error('Error sending typing status:', error);
    }
  },
  
  /**
   * Create a subscription for typing updates
   */
  createTypingSubscription(
    groupId: string,
    username: string,
    onTypingUpdate: (typingUsers: { username: string, avatar?: string, lastTyped: Date }[]) => void
  ) {
    const typingChannel = supabase
      .channel(`typing:${groupId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username: typingUsername, avatar, isTyping } = payload;
        
        // Ignore own typing
        if (typingUsername === username) return;
        
        if (isTyping) {
          onTypingUpdate([{
            username: typingUsername,
            avatar,
            lastTyped: new Date()
          }]);
        } else {
          onTypingUpdate([]);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status for typing:', status);
      });

    return typingChannel;
  }
};
