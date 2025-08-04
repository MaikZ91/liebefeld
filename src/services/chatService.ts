
import { supabase } from '@/integrations/supabase/client';
import { reactionService } from './reactionService';
import { messageService } from './messageService';
import { subscriptionService } from './subscriptionService';
import { typingService } from './typingService';

export const chatService = {
  async sendMessage(groupId: string, content: string, username: string, avatar?: string, eventId?: string, eventTitle?: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          text: content, // Use 'text' instead of 'content'
          sender: username, // Use 'sender' instead of 'user_name'
          avatar: avatar || null,
          event_id: eventId || null,
          event_title: eventTitle || null,
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
  },

  // Restore missing methods from other services
  enableRealtime: messageService.enableRealtime,
  fetchMessages: messageService.fetchMessages,
  markMessagesAsRead: messageService.markMessagesAsRead,
  
  // Subscription operations
  createMessageSubscription: subscriptionService.createMessageSubscription,
  
  // Typing indicator operations
  sendTypingStatus: typingService.sendTypingStatus,
  createTypingSubscription: typingService.createTypingSubscription
};
