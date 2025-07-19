import { setupService } from './setupService';
import { chatService } from './chatService';
import { USERNAME_KEY } from '@/types/chatTypes';

export const eventChatService = {
  /**
   * Join an event-specific chat group
   */
  async joinEventChat(eventId: string, eventTitle: string): Promise<string | null> {
    try {
      const username = localStorage.getItem(USERNAME_KEY) || 'Gast';
      
      // Ensure the event group exists
      const groupId = await setupService.ensureEventGroupExists(eventId, eventTitle);
      
      if (!groupId) {
        console.error('Failed to create event group');
        return null;
      }

      // Always send join message to community chat when joining event chat
      await setupService.sendEventJoinMessage(username, eventTitle, eventId);

      return groupId;
    } catch (error) {
      console.error('Error joining event chat:', error);
      return null;
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