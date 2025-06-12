
import { Event } from '@/types/eventTypes';
import { ChatMessage, PanelEventData, PanelEvent } from '@/components/event-chat/types';
import { createResponseHeader } from '@/utils/chatUtils';

export const createEventNotificationMessage = (
  newEventCount: number, 
  newEvents: Event[]
): ChatMessage => {
  const message = newEventCount === 1 
    ? `🎉 Es gibt ein neues Event!` 
    : `🎉 Es gibt ${newEventCount} neue Events!`;
  
  // Create panel data with the new events
  const panelEvents: PanelEvent[] = newEvents.slice(0, 5).map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    price: event.is_paid ? "Kostenpflichtig" : "Kostenlos",
    location: event.location,
    image_url: event.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
    category: event.category,
    link: event.link
  }));

  const panelData: PanelEventData = {
    events: panelEvents,
    currentIndex: 0
  };

  // Create HTML content for the notification
  const htmlContent = `
    ${createResponseHeader("Neue Events verfügbar!")}
    <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">🎉</span>
        <span class="font-medium text-red-200">${message}</span>
      </div>
      <p class="text-sm text-gray-300">
        Entdecke die neuesten Events in deiner Stadt. Klicke auf die Events unten, um mehr Details zu erfahren.
      </p>
    </div>
  `;

  return {
    id: `event-notification-${Date.now()}`,
    isUser: false,
    text: message,
    html: htmlContent,
    panelData: panelData,
    timestamp: new Date().toISOString(),
    isEventNotification: true
  };
};

export const getNewEventsFromIds = (events: Event[], newEventIds: Set<string>): Event[] => {
  return events.filter(event => newEventIds.has(event.id));
};
