import React, { useRef, useEffect, useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, BadgePlus } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';

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
  const { newEventIds } = useEventContext();
  
  useEffect(() => {
    if (events.length > 0) {
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
  }, [events]);
  
  const eventsByDate = React.useMemo(() => {
    const grouped = groupEventsByDate(events);
    
    Object.keys(grouped).forEach(dateStr => {
      grouped[dateStr].sort((a, b) => {
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        
        return a.id.localeCompare(b.id);
      });
    });
    
    return grouped;
  }, [events]);
  
  useEffect(() => {
    if (todayRef.current && listRef.current && !hasScrolledToToday && Object.keys(eventsByDate).length > 0) {
      console.log('EventList: Attempting to scroll to today (first load only)');
      
      setTimeout(() => {
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
              console.log('EventList: Smooth scroll completed');
              setHasScrolledToToday(true);
            }
          };
          
          requestAnimationFrame(animateScroll);
          console.log('EventList: Starting gentle scroll animation');
        }
      }, 300);
    } else {
      console.log('EventList: Today ref or list ref not found or already scrolled', { 
        todayRef: !!todayRef.current, 
        listRef: !!listRef.current,
        hasScrolledToToday,
        eventsLength: Object.keys(eventsByDate).length
      });
    }
  }, [eventsByDate]);
  
  useEffect(() => {
    setHasScrolledToToday(false);
  }, [showFavorites]);
  
  return (
    <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          {showFavorites ? "Meine Favoriten" : "Alle Events"}
        </h3>
        
        {newEventIds.size > 0 && !showFavorites && (
          <div className="flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded-full">
            <BadgePlus className="w-4 h-4 text-green-500" />
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
                  {hasNewEvents && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <BadgePlus className="w-3 h-3" />
                      <span>Neu</span>
                    </span>
                  )}
                </h4>
                <div className="space-y-1">
                  {eventsByDate[dateStr].map(event => {
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
                            className={isTopEvent ? 'border-l-2 border-[#E53935]' : isNewEvent ? 'border-l-2 border-green-500' : ''}
                          />
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
              : "Keine Events gefunden"}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
