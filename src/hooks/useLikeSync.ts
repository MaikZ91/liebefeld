
import { useEffect, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';

// Optimized hook for intelligent like synchronization
export const useLikeSync = () => {
  const { events, eventLikes, refreshEvents } = useEventContext();
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(0);
  const lastActivityTime = useRef<number>(Date.now());

  // Track user activity to determine if sync is needed
  useEffect(() => {
    const trackActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Listen for user interactions
    const events = ['click', 'scroll', 'keypress', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, []);

  // Intelligent sync - only when necessary
  useEffect(() => {
    const intelligentSync = async () => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTime.current;
      const timeSinceLastActivity = now - lastActivityTime.current;
      
      // Only sync if:
      // 1. More than 5 minutes since last sync
      // 2. User has been inactive for at least 2 minutes (to avoid disrupting active usage)
      // 3. Page is visible
      if (timeSinceLastSync > 300000 && 
          timeSinceLastActivity > 120000 && 
          !document.hidden) {
        console.log('Performing intelligent background sync...');
        await refreshEvents();
        lastSyncTime.current = now;
      }
    };

    // Initial sync on mount (but wait a bit for UI to settle)
    const initialSyncTimer = setTimeout(() => {
      lastSyncTime.current = Date.now();
    }, 2000);

    // Set up intelligent sync interval (check every 2 minutes)
    syncInterval.current = setInterval(intelligentSync, 120000);

    // Sync when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastSync = Date.now() - lastSyncTime.current;
        // If user was away for more than 5 minutes, sync
        if (timeSinceLastSync > 300000) {
          console.log('User returned, performing sync...');
          intelligentSync();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialSyncTimer);
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
