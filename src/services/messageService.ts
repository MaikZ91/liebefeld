
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chatTypes';

/**
 * Service for message-related operations
 */
export const messageService = {
  /**
   * Enable Realtime for the chat messages table
   */
  async enableRealtime(): Promise<boolean> {
    try {
      // Important: Explicitly type the parameter object to avoid TypeScript errors
      type EnableRealtimeParams = { table_name: string };
      const params: EnableRealtimeParams = { table_name: 'chat_messages' };
      
      const { error } = await supabase.rpc('enable_realtime_for_table', params);
      
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
  }
};
