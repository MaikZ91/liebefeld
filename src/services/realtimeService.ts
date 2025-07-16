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
  setupMessageListener(groupId: string, onMessage: (message: Message) => void, onMessageUpdate?: (message: Message) => void) {
    console.log(`Setting up message listener for group: ${groupId}`);
    
    // Create a channel name based on the group ID
    const channelName = `messages:${groupId}`;
    
    // Set up the broadcast channel
    const broadcastChannel = this.setupChannel(channelName, (payload) => {
      if (payload?.payload?.message) {
        console.log(`Received message via broadcast:`, payload.payload.message);
        onMessage(payload.payload.message);
      }
    });
    
    // Set up a direct database listener for INSERT
    const dbChannel = supabase
      .channel(`db-changes:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Database INSERT detected:', payload);
        if (payload.new) {
          const message: Message = {
            id: (payload.new as any).id,
            created_at: (payload.new as any).created_at,
            text: (payload.new as any).text, // Changed from 'content' to 'text'
            user_name: (payload.new as any).sender,
            user_avatar: (payload.new as any).avatar || '',
            group_id: (payload.new as any).group_id,
            reactions: (payload.new as any).reactions || [],
          };
          
          console.log('Converted message from DB change:', message);
          onMessage(message);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Database UPDATE detected:', payload);
        if (payload.new && onMessageUpdate) {
          const message: Message = {
            id: (payload.new as any).id,
            created_at: (payload.new as any).created_at,
            text: (payload.new as any).text,
            user_name: (payload.new as any).sender,
            user_avatar: (payload.new as any).avatar || '',
            group_id: (payload.new as any).group_id,
            reactions: (payload.new as any).reactions || [],
          };
          
          console.log('Converted updated message from DB change:', message);
          onMessageUpdate(message);
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