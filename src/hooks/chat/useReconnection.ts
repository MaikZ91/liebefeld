
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReconnection = (onReconnect: () => void) => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    // First, enable realtime for the table
    try {
      // Use a properly typed approach for RPC calls
      const { data, error } = await supabase.rpc('enable_realtime_for_table', {
        table_name: 'chat_messages'
      } as any);
      
      if (error) {
        console.error('Error enabling realtime:', error);
      } else {
        console.log('Realtime enabled result:', data);
      }
      
      // Then remove all existing channels and reestablish
      await supabase.removeAllChannels();
      
      // Execute the callback to refetch messages and reestablish subscriptions
      onReconnect();
      
      // Wait a bit to show the reconnection state
      setTimeout(() => {
        setIsReconnecting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error during reconnection:', error);
      setIsReconnecting(false);
    }
  };

  return {
    isReconnecting,
    setIsReconnecting,
    handleReconnect
  };
};
