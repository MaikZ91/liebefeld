
import { useEffect, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';

// Simplified hook for like synchronization - re-enabled for proper event display
export const useLikeSync = () => {
  const { events, eventLikes, refreshEvents } = useEventContext();
  const lastSyncTime = useRef<number>(0);

  // Re-enable basic sync functionality to ensure events are displayed properly
  useEffect(() => {
    console.log('useLikeSync: Basic sync enabled for event display');
    
    // Only sync when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        // Only sync if more than 60 seconds have passed since last sync
        if (now - lastSyncTime.current > 60000) {
          console.log('useLikeSync: Syncing on page visibility change...');
          refreshEvents();
          lastSyncTime.current = now;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshEvents]);

  return {
    eventLikes,
    events
  };
};
