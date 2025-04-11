
import React, { useRef, useEffect, useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';

interface EventListProps {
  events: Event[];
  showFavorites: boolean;
  showNewEvents?: boolean;
  onSelectEvent: (event: Event, date: Date) => void;
  onLike: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({
  events,
  showFavorites,
  showNewEvents = false,
  onSelectEvent,
  onLike
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  const [topTodayEvent, setTopTodayEvent] = useState<Event | null>(null);
  const { newEventIds, filter, topEventsPerDay } = useEventContext();
  
  const filteredEvents = React.useMemo(() => {
    if (!filter) return events;
    return events.filter(event => event.category === filter);
  }, [events, filter]);
  
  const displayEvents = React.useMemo(() => {
    if (!showFavorites) return filteredEvents;
    
    return filteredEvents.filter(event => {
      if (!event.date) return false;
      
      // Make sure it's a top event and has at least one like
      return topEventsPerDay[event.date] === event.id && (event.likes && event.likes > 0);
    });
  }, [filteredEvents, showFavorites, topEventsPerDay]);
  
  useEffect(() => {
    if (displayEvents.length > 0) {
      const todayEvents = displayEvents.filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parseISO(event.date);
          return isToday(eventDate);
        } catch (error) {
          console.error(`Error checking if event is today:`, error);
          return false;
        }
      });
      
      if (todayEvents.length > 0) {
        const popular = [...todayEvents].sort((a, b) => {
          const likesA = a.likes || 0;
          const likesB = b.likes || 0;
          
          if (likesB !== likesA) {
            return likesB - likesA;
          }
          
          return a.id.localeCompare(b.id);
        })[0];
        
        setTopTodayEvent(popular);
        console.log("Top event today:", popular.title, "with", popular.likes, "likes", "ID:", popular.id);
      } else {
        setTopTodayEvent(null);
      }
    }
  }, [displayEvents]);
  
  const eventsByDate = React.useMemo(() => {
    const grouped = groupEventsByDate(displayEvents);
    
    Object.keys(grouped).forEach(dateStr => {
      // Debug info for specific dates (10th and 11th April)
      if (dateStr.includes('2025-04-10') || dateStr.includes('2025-04-11')) {
        console.log(`Debug: Events for ${dateStr}:`, 
          grouped[dateStr].map(e => ({
            id: e.id, 
            title: e.title,
            likes: e.likes || 0,
            hash: e.id.substring(7) // Zeige den Hash-Teil der ID an
          }))
        );
      }
      
      grouped[dateStr].sort((a, b) => {
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        
        // When likes are equal, use a stable ID sorting
        return a.id.localeCompare(b.id);
      });
      
      // Debug info after sorting for specific dates
      if (dateStr.includes('2025-04-10') || dateStr.includes('2025-04-11')) {
        console.log(`Debug: Sorted events for ${dateStr}:`, 
          grouped[dateStr].map(e => ({
            id: e.id, 
            title: e.title,
            likes: e.likes || 0,
            hash: e.id.substring(7) // Zeige den Hash-Teil der ID an
          }))
        );
      }
    });
    
    return grouped;
  }, [displayEvents]);
  
  useEffect(() => {
    if (todayRef.current && listRef.current && !hasScrolledToToday && Object.keys(eventsByDate).length > 0) {
      console.log('EventList: Waiting for animations to complete before scrolling to today');
      
      const scrollTimer = setTimeout(() => {
        if (todayRef.current && listRef.current) {
          const targetScrollTop = todayRef.current.offsetTop - 80;
          const currentScrollTop = listRef.current.scrollTop;
          
          const duration = 800;
          const startTime = performance.now();
          
          const animateScroll = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            
            if (elapsedTime < duration) {
              const progress = 1 - Math.pow(1 - elapsedTime / duration, 2);
              const scrollValue = currentScrollTop + (targetScrollTop - currentScrollTop) * progress;
              listRef.current!.scrollTop = scrollValue;
              requestAnimationFrame(animateScroll);
            } else {
              listRef.current!.scrollTop = targetScrollTop;
              console.log('EventList: Smooth scroll completed after animations');
              setHasScrolledToToday(true);
            }
          };
          
          requestAnimationFrame(animateScroll);
        }
      }, 5500);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [eventsByDate, hasScrolledToToday]);
  
  useEffect(() => {
    setHasScrolledToToday(false);
  }, [showFavorites, showNewEvents, filter]);
  
  return (
    <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          {showFavorites 
            ? "Top Events" 
            : showNewEvents 
              ? "Neue Events" 
              : filter 
                ? `${filter} Events` 
                : "Alle Events"}
        </h3>
        
        {newEventIds.size > 0 && !showFavorites && !showNewEvents && (
          <div className="flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded-full">
            <span className="text-green-400 text-xs font-bold">NEW</span>
            <span className="text-green-400 text-xs font-medium">{newEventIds.size} neue Events</span>
          </div>
        )}
      </div>
      
      <div ref={listRef} className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
        {Object.keys(eventsByDate).length > 0 ? (
          Object.keys(eventsByDate).sort().map(dateStr => {
            const date = parseISO(dateStr);
            const isCurrentDay = isToday(date);
            const hasNewEvents = eventsByDate[dateStr].some(event => newEventIds.has(event.id));
            
            return (
              <div 
                key={dateStr} 
                ref={isCurrentDay ? todayRef : null}
                className={`mb-4 ${isCurrentDay ? 'scroll-mt-12' : ''}`}
                id={isCurrentDay ? "today-section" : undefined}
              >
                <h4 className="text-sm font-medium mb-2 text-white sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-2 z-10 rounded-md flex items-center">
                  {format(date, 'EEEE, d. MMMM', { locale: de })}
                  {dateStr === '2025-04-10' && <span className="ml-2 text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full">Debug: 10.4</span>}
                  {dateStr === '2025-04-11' && <span className="ml-2 text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full">Debug: 11.4</span>}
                  {hasNewEvents && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <span className="font-bold">NEW</span>
                    </span>
                  )}
                </h4>
                <div className="space-y-1">
                  {eventsByDate[dateStr].map((event, eventIndex) => {
                    const isTopEvent = isCurrentDay && topTodayEvent && event.id === topTodayEvent.id;
                    const isNewEvent = newEventIds.has(event.id);
                    
                    return (
                      <div key={event.id} className={`relative ${isTopEvent ? 'transform transition-all' : ''}`}>
                        {isTopEvent && (
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#E53935] to-[#C62828] rounded-full"></div>
                        )}
                        {isNewEvent && !isTopEvent && (
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-700 rounded-full"></div>
                        )}
                        <div className={`${isTopEvent ? 'bg-gradient-to-r from-[#C62828]/20 to-transparent rounded-lg' : isNewEvent ? 'bg-gradient-to-r from-green-600/10 to-transparent rounded-lg' : ''}`}>
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
                            className={`${isTopEvent ? 'border-l-2 border-[#E53935]' : isNewEvent ? 'border-l-2 border-green-500' : ''} relative`}
                          />
                          {(dateStr === '2025-04-10' || dateStr === '2025-04-11') && (
                            <div className="absolute right-2 bottom-2 bg-orange-600/80 text-white px-2 py-0.5 rounded-full text-xs z-10">
                              Hash: {event.id.substring(7)} | Likes: {event.likes || 0} | Pos: {eventIndex + 1}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            {showFavorites 
              ? "Du hast noch keine Favoriten" 
              : showNewEvents
                ? "Keine neuen Events gefunden"
                : filter
                  ? `Keine ${filter} Events gefunden`
                  : "Keine Events gefunden"}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
