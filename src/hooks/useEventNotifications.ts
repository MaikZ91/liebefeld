
import { useEffect, useRef, useCallback } from 'react';

interface UseEventNotificationsProps {
  onNewEvents: (eventCount: number) => void;
  isEnabled: boolean;
  activeChatMode: 'ai' | 'community';
}

export const useEventNotifications = ({ 
  onNewEvents, 
  isEnabled, 
  activeChatMode 
}: UseEventNotificationsProps) => {
  const lastNotificationTime = useRef<number>(0);
  const previousNewEventCount = useRef<number>(0);
  
  // Minimum time between notifications (5 minutes)
  const MIN_NOTIFICATION_INTERVAL = 5 * 60 * 1000;
  
  const handleNewEvents = useCallback(() => {
    // Notifications temporarily disabled since newEventIds was removed
    console.log('Event notifications temporarily disabled');
  }, []);
  
  useEffect(() => {
    handleNewEvents();
  }, [handleNewEvents]);
  
  return {
    newEventCount: 0,
    hasNewEvents: false
  };
};
