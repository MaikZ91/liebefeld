
import React, { useRef, useEffect, useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star } from 'lucide-react';

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
  const [topTodayEvent, setTopTodayEvent] = useState<Event | null>(null);
  
  // Find the most popular event of today
  useEffect(() => {
    if (events.length > 0) {
      // Filter for today's events
      const todayEvents = events.filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parseISO(event.date);
          return isToday(eventDate);
        } catch (error) {
          console.error(`Error checking if event is today:`, error);
          return false;
        }
      });
      
      // If we have events today, find the one with most likes
      if (todayEvents.length > 0) {
        const popular = [...todayEvents].sort((a, b) => {
          const likesA = a.likes || 0;
          const likesB = b.likes || 0;
          return likesB - likesA;
        })[0];
        
        setTopTodayEvent(popular);
        console.log("Top event today:", popular.title, "with", popular.likes, "likes");
      } else {
        setTopTodayEvent(null);
      }
    }
  }, [events]);
  
  // Group events by date - directly use the events array without filtering
  const eventsByDate = groupEventsByDate(events);
  
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
  
  // Debug how many events we have
  console.log(`EventList rendering with ${events.length} events and ${Object.keys(eventsByDate).length} unique dates`);
  
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
            try {
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
                    {eventsByDate[dateStr].map(event => {
                      // Only highlight if it's today's top event
                      const isTopEvent = isCurrentDay && topTodayEvent && event.id === topTodayEvent.id;
                      
                      return (
                        <div key={event.id} className={`relative ${isTopEvent ? 'transform transition-all' : ''}`}>
                          {isTopEvent && (
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#E53935] to-[#C62828] rounded-full"></div>
                          )}
                          <div className={`${isTopEvent ? 'bg-gradient-to-r from-[#C62828]/20 to-transparent rounded-lg' : ''}`}>
                            {isTopEvent && (
                              <div className="absolute right-2 top-2 bg-[#E53935] text-white px-2 py-1 rounded-full text-xs flex items-center z-20">
                                <Star className="w-3 h-3 mr-1 fill-white" />
                                <span>Top Event</span>
                              </div>
                            )}
                            <EventCard 
                              key={event.id} 
                              event={event}
                              compact={true}
                              onClick={() => onSelectEvent(event, date)}
                              onLike={onLike}
                              className={isTopEvent ? 'border-l-2 border-[#E53935]' : ''}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            } catch (error) {
              console.error(`Error rendering date group: ${dateStr}`, error);
              return null;
            }
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
