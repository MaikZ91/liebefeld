
import React, { useRef, useEffect, useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
  
  // Determine if there are any events for today
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const hasEventsToday = Boolean(eventsByDate[todayStr] && eventsByDate[todayStr].length > 0);
  
  // Scroll to today's section ONLY on component first load and when events are loaded
  useEffect(() => {
    if (todayRef.current && listRef.current && !hasScrolledToToday && Object.keys(eventsByDate).length > 0) {
      console.log('EventList: Attempting to scroll to today (first load only)');
      
      // Wait for render to complete
      setTimeout(() => {
        if (todayRef.current && listRef.current) {
          // Calculate the target scroll position (with offset to position the date header nicely)
          // Increased offset to 80px to leave more space above the first event
          const targetScrollTop = todayRef.current.offsetTop - 80;
          
          // Get current scroll position
          const currentScrollTop = listRef.current.scrollTop;
          
          // Scroll with slow animation using custom easing
          const duration = 800; // Longer duration for slower scroll
          const startTime = performance.now();
          
          const animateScroll = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            
            if (elapsedTime < duration) {
              // Easing function (ease-out) for smooth deceleration
              const progress = 1 - Math.pow(1 - elapsedTime / duration, 2);
              
              // Calculate intermediate scroll position
              const scrollValue = currentScrollTop + (targetScrollTop - currentScrollTop) * progress;
              
              // Update scroll position
              listRef.current!.scrollTop = scrollValue;
              
              // Continue animation
              requestAnimationFrame(animateScroll);
            } else {
              // Ensure we land exactly at the target
              listRef.current!.scrollTop = targetScrollTop;
              console.log('EventList: Smooth scroll completed');
              setHasScrolledToToday(true);
            }
          };
          
          // Start the animation
          requestAnimationFrame(animateScroll);
          console.log('EventList: Starting gentle scroll animation');
        }
      }, 300); // Wait a bit longer before starting to ensure rendering is complete
    } else {
      console.log('EventList: Today ref or list ref not found or already scrolled', { 
        todayRef: !!todayRef.current, 
        listRef: !!listRef.current,
        hasScrolledToToday,
        eventsLength: Object.keys(eventsByDate).length
      });
    }
  }, [eventsByDate]); // Run when events grouping changes

  // Reset scroll state when events or favorites change
  useEffect(() => {
    setHasScrolledToToday(false);
  }, [showFavorites]);
  
  return (
    <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          {showFavorites ? "Meine Favoriten" : "Alle Events"}
        </h3>
      </div>
      
      <div ref={listRef} className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
        {Object.keys(eventsByDate).length > 0 ? (
          <>
            {Object.keys(eventsByDate).sort().map(dateStr => {
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
            })}
            
            {/* Add "Today" section with "No events" message if there are no events today */}
            {!hasEventsToday && !showFavorites && (
              <div 
                ref={todayRef}
                className="mb-4 scroll-mt-12"
                id="today-section"
              >
                <h4 className="text-sm font-medium mb-2 text-white sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-2 z-10 rounded-md">
                  {format(today, 'EEEE, d. MMMM', { locale: de })}
                </h4>
                <div className="flex flex-col items-center justify-center py-6 px-4 bg-[#1E293B]/30 rounded-lg border border-gray-800">
                  <CalendarIcon className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="text-gray-400 text-center">Noch keine Events heute</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <CalendarIcon className="w-8 h-8 mb-2 text-gray-500" />
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
