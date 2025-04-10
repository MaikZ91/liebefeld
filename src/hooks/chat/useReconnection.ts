
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReconnection = (onReconnect: () => void) => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = () => {
    setIsReconnecting(true);
    supabase.removeAllChannels().then(() => {
      onReconnect();
      setTimeout(() => {
        setIsReconnecting(false);
      }, 3000);
    });
  };

  return {
    isReconnecting,
    setIsReconnecting,
    handleReconnect
  };
};
