import { setupService } from './setupService';
import { chatService } from './chatService';
import { USERNAME_KEY } from '@/types/chatTypes';
import { supabase } from '@/integrations/supabase/client';

export const eventChatService = {
  /**
   * Join an event-specific chat group
   */
  async joinEventChat(eventId: string, eventTitle: string): Promise<string | null> {
    try {
      // Ensure the event group exists
      const groupId = await setupService.ensureEventGroupExists(eventId, eventTitle);
      
      if (!groupId) {
        console.error('Failed to create event group');
        return null;
      }

      return groupId;
    } catch (error) {
      console.error('Error joining event chat:', error);
      return null;
    }
  },

  /**
   * Check if a user is posting their first message in an event group
   * and send mirror message to community chat
   */
  async handleFirstEventMessage(groupId: string, username: string): Promise<void> {
    try {
      if (!this.isEventGroup(groupId)) return;
      
      const eventId = this.extractEventId(groupId);
      if (!eventId) return;

      // Check if this is the user's first message in this group
      const messages = await chatService.getMessages(groupId, 50);
      const userMessages = messages.filter(msg => msg.sender === username);
      
      if (userMessages.length === 1) {
        // This is the user's first message, get event details and send mirror message
        const { data: event } = await supabase
          .from('community_events')
          .select('title')
          .eq('id', eventId)
          .single();
          
        if (event) {
          await setupService.sendEventJoinMessage(username, event.title, eventId);
        }
      }
    } catch (error) {
      console.error('Error handling first event message:', error);
    }
  },

  /**
   * Get event group ID from event ID
   */
  getEventGroupId(eventId: string): string {
    return `event-${eventId}`;
  },

  /**
   * Check if a group ID is an event group
   */
  isEventGroup(groupId: string): boolean {
    return groupId.startsWith('event-');
  },

  /**
   * Extract event ID from event group ID
   */
  extractEventId(groupId: string): string | null {
    if (!this.isEventGroup(groupId)) {
      return null;
    }
    return groupId.replace('event-', '');
  }
};