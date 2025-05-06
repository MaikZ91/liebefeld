
import { supabase } from '@/integrations/supabase/client';

export const initializeSupabase = async () => {
  try {
    // Initialize avatar bucket and policies
    await supabase.functions.invoke('configure_avatar_bucket');
    console.log('Avatar bucket configured successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return false;
  }
};
