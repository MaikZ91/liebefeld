
import { useEffect, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';

// Simplified hook for synchronizing likes across components
export const useLikeSync = () => {
  const { events, eventLikes, refreshEvents } = useEventContext();
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(0);

  // Sync likes every 30 seconds when user is active
  useEffect(() => {
    const syncLikes = async () => {
      const now = Date.now();
      // Only sync if more than 30 seconds have passed since last sync
      if (now - lastSyncTime.current > 30000) {
        console.log('Syncing event likes...');
        await refreshEvents();
        lastSyncTime.current = now;
      }
    };

    // Initial sync on mount
    syncLikes();

    // Set up periodic sync
    syncInterval.current = setInterval(syncLikes, 30000);

    // Sync when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncLikes();
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
