
import { supabase } from '@/integrations/supabase/client';
import { messageService } from './messageService';

/**
 * Service to handle initial database setup
 */
export const setupService = {
  /**
   * Ensure that the default chat group exists
   */
  async ensureDefaultGroupExists(): Promise<boolean> {
    try {
      console.log('Checking if default group exists');
      
      // Check if the default group already exists
      const { data: existingGroup, error: checkError } = await supabase
        .from('chat_groups')
        .select('id')
        .eq('id', messageService.DEFAULT_GROUP_ID)
        .single();
        
      if (!checkError && existingGroup) {
        console.log('Default group already exists');
        return true;
      }
      
      // Insert the default group if it doesn't exist
      const { error: insertError } = await supabase
        .from('chat_groups')
        .insert([{
          id: messageService.DEFAULT_GROUP_ID,
          name: 'General',
          description: 'General chat group'
        }])
        .select('id');
        
      if (insertError) {
        console.error('Error creating default group:', insertError);
        return false;
      }
      
      console.log('Default group created successfully');
      return true;
    } catch (error) {
      console.error('Error in ensureDefaultGroupExists:', error);
      return false;
    }
  },

  /**
   * Ensure that an event-specific chat group exists
   */
  async ensureEventGroupExists(eventId: string, eventTitle: string): Promise<string | null> {
    try {
      const groupId = `event-${eventId}`;
      console.log(`Checking if event group exists: ${groupId}`);
      
      // Check if the event group already exists
      const { data: existingGroup, error: checkError } = await supabase
        .from('chat_groups')
        .select('id')
        .eq('id', groupId)
        .single();
        
      if (!checkError && existingGroup) {
        console.log('Event group already exists');
        return groupId;
      }
      
      // Insert the event group if it doesn't exist
      const { error: insertError } = await supabase
        .from('chat_groups')
        .insert([{
          id: groupId,
          name: `Event: ${eventTitle}`,
          description: `Chat für Event: ${eventTitle}`
        }])
        .select('id');
        
      if (insertError) {
        console.error('Error creating event group:', insertError);
        return null;
      }
      
      console.log('Event group created successfully');
      return groupId;
    } catch (error) {
      console.error('Error in ensureEventGroupExists:', error);
      return null;
    }
  },

  /**
   * Send a mirror message to community chat when user joins an event channel
   */
  async sendEventJoinMessage(username: string, eventTitle: string, eventId: string): Promise<boolean> {
    try {
      const message = `${username} ist dem Eventchannel "${eventTitle}" beigetreten 🎉`;
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: messageService.DEFAULT_GROUP_ID,
          text: message,
          sender: 'System',
          avatar: null,
          event_id: eventId,
          event_title: eventTitle
        });

      if (error) {
        console.error('Error sending event join message:', error);
        return false;
      }

      console.log('Event join message sent to community chat');
      return true;
    } catch (error) {
      console.error('Error in sendEventJoinMessage:', error);
      return false;
    }
  }
};
