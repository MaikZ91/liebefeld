
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
  }
};
