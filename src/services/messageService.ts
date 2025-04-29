
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chatTypes';

/**
 * Service for message-related operations
 */
export const messageService = {
  /**
   * Enable Realtime for the chat messages table
   * We're using a direct channel approach instead of RPC
   */
  async enableRealtime(): Promise<boolean> {
    try {
      console.log('Setting up realtime subscription for chat_messages table');
      
      // Direct approach - create a channel and enable realtime
      const channel = supabase
        .channel('realtime_setup')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        }, () => {
          // Empty callback - we just want to ensure the channel is created
        })
        .subscribe();
      
      // Keep the channel open for a moment to ensure subscription is registered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then remove it to avoid having too many open channels
      supabase.removeChannel(channel);
      
      console.log('Realtime subscription initialized directly');
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
      console.log(`Fetching messages for group ${groupId}`);
      
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
        // We no longer add event_data directly here
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
      console.log(`Sending message to group ${groupId} from ${username}`);
      
      // Remove any event_data related fields to avoid schema issues
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
      
      console.log(`Message sent successfully with ID: ${data?.id}`);
      
      // Force a refresh by sending a broadcast to update everyone's view
      const channel = supabase.channel(`force_refresh:${groupId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'force_refresh',
        payload: { message_id: data?.id, timestamp: new Date().toISOString() }
      });
      
      // Remove the channel after use
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 2000);
      
      return data?.id || null;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }
};
