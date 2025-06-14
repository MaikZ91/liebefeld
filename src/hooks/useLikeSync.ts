
import { useEffect, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';

// Optimized hook for synchronizing likes across components
export const useLikeSync = () => {
  const { events, eventLikes, refreshEvents } = useEventContext();
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(0);

  // Disabled automatic sync to prevent interference with like operations
  // The main EventContext now handles periodic refreshes more intelligently
  useEffect(() => {
    console.log('useLikeSync: Automatic sync disabled to prevent race conditions');
    
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
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshEvents]);

  return {
    eventLikes,
    events
  };
};
