
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for message reaction operationsS
 */
export const reactionService = {
  /**
   * Add or remove a reaction to a message
   */
  async toggleReaction(messageId: string, emoji: string, username: string): Promise<boolean> {
    try {
      console.log('reactionService: toggleReaction called', { messageId, emoji, username });
      
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
      
      console.log('Current message data:', data);
      
      // Update reactions
      const reactions = Array.isArray(data?.reactions) ? data.reactions : [];
      let updated = false;
      
      const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // Reaction already exists, add or remove user
        const reaction = reactions[existingReactionIndex] as { emoji: string; users: string[] };
        const users = reaction.users || [];
        const userIndex = users.indexOf(username);
        
        if (userIndex >= 0) {
          // Remove user
          users.splice(userIndex, 1);
          // Remove reaction if no users left
          if (users.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          }
          console.log('Removed user from reaction');
        } else {
          // Add user
          users.push(username);
          console.log('Added user to reaction');
        }
        updated = true;
      } else {
        // Add new reaction
        reactions.push({
          emoji,
          users: [username]
        });
        console.log('Added new reaction');
        updated = true;
      }
      
      console.log('Updated reactions:', reactions);
      
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
        
        console.log('Reactions updated successfully in database');
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  }
};
