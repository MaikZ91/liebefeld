
import React, { useRef, useEffect, useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';

interface EventListProps {
  events: Event[];
  showFavorites: boolean;
  onSelectEvent: (event: Event, date: Date) => void;
  onLike: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({
  events,
  showFavorites,
  onSelectEvent,
  onLike
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  
  // Group events by date
  const eventsByDate = groupEventsByDate(events);
  
  // Reset scroll state when events or favorites change
  useEffect(() => {
    setHasScrolledToToday(false);
  }, [events, showFavorites]);
  
  // Scroll to today's section when component loads or events change
  useEffect(() => {
    // Only attempt to scroll if we haven't scrolled yet and we have events
    if (!hasScrolledToToday && Object.keys(eventsByDate).length > 0) {
      console.log('EventList: Checking if we can scroll to today section');
      
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        // Find today's section if it exists
        const todayElement = document.getElementById('today-section');
        
        if (todayElement && listRef.current) {
          console.log('EventList: Found today section element', todayElement);
          
          // Calculate the target scroll position (with offset for better positioning)
          const targetScrollTop = todayElement.offsetTop - 80;
          
          // Immediate scroll for performance
          listRef.current.scrollTop = targetScrollTop;
          
          // Then smooth scroll for visual polish
          listRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
          
          console.log('EventList: Scrolled to today section at position', targetScrollTop);
          setHasScrolledToToday(true);
        } else {
          console.log('EventList: Today section not found in DOM', { 
            todayElement: !!todayElement, 
            listRef: !!listRef.current,
            eventsByDateLength: Object.keys(eventsByDate).length
          });
        }
      }, 100); // Short delay to ensure DOM is ready
    }
  }, [eventsByDate, hasScrolledToToday]);
  
  return (
    <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          {showFavorites ? "Meine Favoriten" : "Alle Events"}
        </h3>
      </div>
      
      <div ref={listRef} className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
        {Object.keys(eventsByDate).length > 0 ? (
          Object.keys(eventsByDate).sort().map(dateStr => {
            const date = parseISO(dateStr);
            const isCurrentDay = isToday(date);
            
            return (
              <div 
                key={dateStr} 
                ref={isCurrentDay ? todayRef : null}
                className={`mb-4 ${isCurrentDay ? 'scroll-mt-12' : ''}`}
                id={isCurrentDay ? "today-section" : undefined}
              >
                <h4 className="text-sm font-medium mb-2 text-white sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-2 z-10 rounded-md">
                  {format(date, 'EEEE, d. MMMM', { locale: de })}
                </h4>
                <div className="space-y-1">
                  {eventsByDate[dateStr].map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event}
                      compact={true}
                      onClick={() => onSelectEvent(event, date)}
                      onLike={onLike}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            {showFavorites 
              ? "Du hast noch keine Favoriten" 
              : "Keine Events gefunden"}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
