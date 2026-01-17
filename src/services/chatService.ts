
import { supabase } from '@/integrations/supabase/client';
import { reactionService } from './reactionService';
import { messageService } from './messageService';
import { subscriptionService } from './subscriptionService';
import { typingService } from './typingService';
import { pushNotificationService } from './pushNotificationService';

// Simple client-side de-duplication to avoid double inserts
const recentSends = new Map<string, number>();
const DUP_WINDOW_MS = 2000;

export const chatService = {
  async sendMessage(groupId: string, content: string, username: string, avatarOrMediaUrl?: string, mediaUrl?: string | null) {
    try {
      // Handle both old signature (avatar as 4th param) and new signature (mediaUrl as 4th param)
      let avatar: string | undefined;
      let finalMediaUrl: string | null = null;
      
      // If 5th param exists, 4th is avatar and 5th is mediaUrl
      if (mediaUrl !== undefined) {
        avatar = avatarOrMediaUrl;
        finalMediaUrl = mediaUrl;
      } else if (avatarOrMediaUrl) {
        // Check if 4th param looks like a URL (media) or avatar
        if (avatarOrMediaUrl.startsWith('http') && avatarOrMediaUrl.includes('chat-media')) {
          finalMediaUrl = avatarOrMediaUrl;
        } else {
          avatar = avatarOrMediaUrl;
        }
      }
      
      // Client-side de-duplication to avoid double inserts within a short window
      const key = `${groupId}:${username}:${content.trim()}:${finalMediaUrl || ''}`;
      const now = Date.now();
      const last = recentSends.get(key);
      if (last && now - last < DUP_WINDOW_MS) {
        console.warn('[chatService] Duplicate send prevented', { key });
        return null;
      }
      recentSends.set(key, now);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          text: content,
          sender: username,
          avatar: avatar || null,
          media_url: finalMediaUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Fire-and-forget push notification (do not block send)
      pushNotificationService.sendPush(username, content, data?.id).catch((e) => {
        console.error('[chatService] push send failed:', e);
      });

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
  
  // Subscription operations
  createMessageSubscription: subscriptionService.createMessageSubscription,
  
  // Typing indicator operations
  sendTypingStatus: typingService.sendTypingStatus,
  createTypingSubscription: typingService.createTypingSubscription
};
