// src/services/realtimeService.ts
// Changed: 'content' to 'text'
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chatTypes';

/**
 * Service for managing realtime connections
 */
export const realtimeService = {
  /**
   * Setup a realtime connection for a specific channel
   */
  setupChannel(channelName: string, callback: (payload: any) => void) {
    console.log(`Setting up realtime channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: '*' }, (payload) => {
        console.log(`Received broadcast on ${channelName}:`, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log(`Channel ${channelName} status:`, status);
      });

    return channel;
  },

  /**
   * Setup a direct message listener for a specific group
   */
  setupMessageListener(groupId: string, onMessage: (message: Message) => void) {
    console.log(`Setting up message listener for group: ${groupId}`);

    // Create a channel name based on the group ID
    const channelName = `messages:${groupId}`;

    // Set up the broadcast channel
    const broadcastChannel = this.setupChannel(channelName, async (payload) => {
      if (payload?.payload?.message) {
        console.log(`Received message via broadcast:`, payload.payload.message);

        // Write the message to database
        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .insert([{ ...payload.payload.message, id: undefined }]) // [RESULT] Ensure id is undefined so Supabase generates a new one
            .select('*')
            .single();

          if (error) {
            console.error('Error writing message to DB:', error);
            return;
          }

          // Convert DB format to Message format and notify UI
          const message: Message = {
            id: data.id,
            created_at: data.created_at,
            text: data.text,
            user_name: data.sender,
            user_avatar: data.avatar || '',
            group_id: data.group_id,
            tempId: payload.payload.message.tempId // [RESULT] Pass the original temporary ID
          };

          console.log('Message written to DB and forwarding to UI:', message);
          onMessage(message);
        } catch (err) {
          console.error('Exception writing message to DB:', err);
        }
      }
    });

    // Set up a direct database listener
    const dbChannel = supabase
      .channel(`db-changes:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Database change detected:', payload);
        if (payload.new) {
          const message: Message = {
            id: (payload.new as any).id,
            created_at: (payload.new as any).created_at,
            text: (payload.new as any).text, // Changed from 'content' to 'text'
            user_name: (payload.new as any).sender,
            user_avatar: (payload.new as any).avatar || '',
            group_id: (payload.new as any).group_id,
            // No tempId here, as this is the actual DB message
          };

          console.log('Converted message from DB change:', message);
          onMessage(message);
        }
      })
      .subscribe();

    return [broadcastChannel, dbChannel];
  },

  /**
   * Send a message to a specific channel
   */
  async sendToChannel(channelName: string, event: string, payload: any) {
    console.log(`Sending to channel ${channelName}, event ${event}:`, payload);

    const channel = supabase.channel(channelName);
    await channel.subscribe();

    const result = await channel.send({
      type: 'broadcast',
      event,
      payload
    });

    // Clean up the channel after use
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 1000);

    return result;
  }
};