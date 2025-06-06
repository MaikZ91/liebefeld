
import { supabase } from '@/integrations/supabase/client';
import { reactionService } from './reactionService';

export const chatService = {
  async sendMessage(groupId: string, content: string, username: string, avatar?: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          content,
          user_name: username,
          user_avatar: avatar || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async getMessages(groupId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  async toggleReaction(messageId: string, emoji: string, username: string) {
    return await reactionService.toggleReaction(messageId, emoji, username);
  }
};
