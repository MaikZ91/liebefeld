
import React, { useRef, useEffect } from 'react';
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
  
  // Group events by date
  const eventsByDate = groupEventsByDate(events);
  
  // Scroll to today's section when component loads
  useEffect(() => {
    if (todayRef.current && listRef.current) {
      console.log('EventList: Attempting to scroll to today');
      
      // Force layout calculation
      listRef.current.getBoundingClientRect();
      
      // First immediate scroll to today's section
      if (todayRef.current) {
        // Use direct DOM method for immediate positioning
        listRef.current.scrollTop = todayRef.current.offsetTop - 20;
        
        console.log('EventList: Initial scroll to position', todayRef.current.offsetTop);
        
        // Then smooth scroll for better UX after a small delay
        setTimeout(() => {
          todayRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
          console.log('EventList: Smooth scroll applied');
        }, 150);
      }
    } else {
      console.log('EventList: Today ref or list ref not found', { 
        todayRef: !!todayRef.current, 
        listRef: !!listRef.current 
      });
    }
  }, [eventsByDate]); // Re-run when events grouping changes
  
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
                className={`mb-4 ${isCurrentDay ? 'scroll-mt-4' : ''}`}
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
