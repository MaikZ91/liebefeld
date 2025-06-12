
import { useEffect, useRef, useCallback } from 'react';
import { useEventContext } from '@/contexts/EventContext';

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
  const { newEventIds, events } = useEventContext();
  const lastNotificationTime = useRef<number>(0);
  const previousNewEventCount = useRef<number>(0);
  
  // Minimum time between notifications (5 minutes)
  const MIN_NOTIFICATION_INTERVAL = 5 * 60 * 1000;
  
  const handleNewEvents = useCallback(() => {
    const now = Date.now();
    const currentNewEventCount = newEventIds.size;
    
    // Only notify if:
    // 1. Feature is enabled
    // 2. We're in AI chat mode
    // 3. There are new events
    // 4. The count has increased since last check
    // 5. Enough time has passed since last notification
    if (
      isEnabled &&
      activeChatMode === 'ai' &&
      currentNewEventCount > 0 &&
      currentNewEventCount > previousNewEventCount.current &&
      now - lastNotificationTime.current >= MIN_NOTIFICATION_INTERVAL
    ) {
      console.log('Triggering event notification for', currentNewEventCount, 'new events');
      onNewEvents(currentNewEventCount);
      lastNotificationTime.current = now;
    }
    
    previousNewEventCount.current = currentNewEventCount;
  }, [newEventIds.size, isEnabled, activeChatMode, onNewEvents]);
  
  useEffect(() => {
    handleNewEvents();
  }, [handleNewEvents]);
  
  return {
    newEventCount: newEventIds.size,
    hasNewEvents: newEventIds.size > 0
  };
};
