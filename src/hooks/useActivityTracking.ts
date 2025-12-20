// src/hooks/useActivityTracking.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { activityTracker } from '@/services/activityTrackingService';

export const useActivityTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Start global tracking on mount
    activityTracker.startTracking();

    return () => {
      activityTracker.stopTracking();
    };
  }, []);

  useEffect(() => {
    // Track page view on route change
    activityTracker.trackPageView(location.pathname);

    return () => {
      // Track page leave when navigating away
      activityTracker.trackPageLeave();
    };
  }, [location.pathname]);

  return {
    trackClick: (target: string, data?: Record<string, unknown>) => 
      activityTracker.trackClick(target, data),
    trackInteraction: (action: string, data?: Record<string, unknown>) => 
      activityTracker.trackInteraction(action, data)
  };
};
