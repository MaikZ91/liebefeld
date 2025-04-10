
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for message reaction operations
 */
export const reactionService = {
  /**
   * Add or remove a reaction to a message
   */
  async toggleReaction(messageId: string, emoji: string, username: string): Promise<boolean> {
    try {
      // Get current message
      const { data, error } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (error) {
        console.error('Error fetching message for reaction:', error);
        return false;
      }
      
      // Update reactions
      const reactions = data?.reactions as any[] || [];
      let updated = false;
      
      const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // Reaction already exists, add or remove user
        const users = reactions[existingReactionIndex].users;
        const userIndex = users.indexOf(username);
        
        if (userIndex >= 0) {
          // Remove user
          users.splice(userIndex, 1);
          // Remove reaction if no users left
          if (users.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          }
        } else {
          // Add user
          users.push(username);
        }
        updated = true;
      } else {
        // Add new reaction
        reactions.push({
          emoji,
          users: [username]
        });
        updated = true;
      }
      
      // Save updated reactions
      if (updated) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ reactions })
          .eq('id', messageId);
          
        if (updateError) {
          console.error('Error updating reactions:', updateError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  }
};
