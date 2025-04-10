
import { supabase } from '@/integrations/supabase/client';
import { Message, TypingUser } from '@/types/chatTypes';

/**
 * Central service for all chat-related Supabase operations.
 */
export const chatService = {
  /**
   * Enable Realtime for the chat messages table
   */
  async enableRealtime(): Promise<boolean> {
    try {
      // Fix: Pass parameters as direct object with explicit typing to match RPC function signature
      const { error } = await supabase.rpc('enable_realtime_for_table', {
        table_name: 'chat_messages'
      } as { table_name: string });
      
      if (error) {
        console.error('Error enabling Realtime:', error);
        return false;
      }
      
      console.log('Realtime successfully enabled');
      return true;
    } catch (error) {
      console.error('Exception in enabling Realtime:', error);
      return false;
    }
  },

  /**
   * Fetch messages for a specific group
   */
  async fetchMessages(groupId: string): Promise<Message[]> {
    try {
      // First enable Realtime for the table
      await this.enableRealtime();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      } 
      
      console.log(`${data?.length || 0} messages received for group ${groupId}`);
      
      // Convert messages to expected format
      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        created_at: msg.created_at,
        content: msg.text,
        user_name: msg.sender,
        user_avatar: msg.avatar || '',
        group_id: msg.group_id,
      }));
      
      return formattedMessages;
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      return [];
    }
  },

  /**
   * Mark messages as read by a specific user
   */
  async markMessagesAsRead(groupId: string, messageIds: string[], username: string): Promise<void> {
    try {
      for (const messageId of messageIds) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('read_by')
          .eq('id', messageId)
          .single();
          
        if (error) {
          console.error(`Error fetching read_by for message ${messageId}:`, error);
          continue;
        }
        
        const readBy = data?.read_by || [];
        
        // Only update if the user is not already in the read_by list
        if (!readBy.includes(username)) {
          const { error: updateError } = await supabase
            .from('chat_messages')
            .update({ read_by: [...readBy, username] })
            .eq('id', messageId);
            
          if (updateError) {
            console.error(`Error updating read_by for message ${messageId}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  /**
   * Send a new message
   */
  async sendMessage(
    groupId: string, 
    username: string, 
    content: string, 
    avatar: string | null = null,
    mediaUrl: string | null = null
  ): Promise<string | null> {
    try {
      // Ensure Realtime is enabled
      await this.enableRealtime();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: groupId,
          sender: username,
          text: content,
          avatar: avatar,
          media_url: mediaUrl,
          read_by: [username] // The sending person has already read the message
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  },

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
   * Add or remove a reaction to a message
   */
  async toggleReaction(messageId: string, emoji: string, username: string): Promise<boolean> {
    try {
      // Get current message
      const { data, error } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (error) {
        console.error('Error fetching message for reaction:', error);
        return false;
      }
      
      // Update reactions
      const reactions = data?.reactions as any[] || [];
      let updated = false;
      
      const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // Reaction already exists, add or remove user
        const users = reactions[existingReactionIndex].users;
        const userIndex = users.indexOf(username);
        
        if (userIndex >= 0) {
          // Remove user
          users.splice(userIndex, 1);
          // Remove reaction if no users left
          if (users.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          }
        } else {
          // Add user
          users.push(username);
        }
        updated = true;
      } else {
        // Add new reaction
        reactions.push({
          emoji,
          users: [username]
        });
        updated = true;
      }
      
      // Save updated reactions
      if (updated) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ reactions })
          .eq('id', messageId);
          
        if (updateError) {
          console.error('Error updating reactions:', updateError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  },

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
  },

  /**
   * Create a subscription for typing updates
   */
  createTypingSubscription(
    groupId: string,
    username: string,
    onTypingUpdate: (typingUsers: TypingUser[]) => void
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
