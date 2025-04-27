import React, { useRef, useEffect, useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [isHochschulsportOpen, setIsHochschulsportOpen] = useState(false);

  const hochschulsportEvents = React.useMemo(() => {
    return events.filter(event => 
      event.title.toLowerCase().includes('hochschulsport') || 
      event.organizer?.toLowerCase().includes('hochschulsport')
    );
  }, [events]);

  const regularEvents = React.useMemo(() => {
    return events.filter(event => 
      !event.title.toLowerCase().includes('hochschulsport') && 
      !event.organizer?.toLowerCase().includes('hochschulsport')
    );
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (!filter) return events;
    return events.filter(event => event.category === filter);
  }, [events, filter]);

  const displayEvents = React.useMemo(() => {
    if (!showFavorites) return filteredEvents;
    
    return filteredEvents.filter(event => {
      if (!event.date) return false;
      
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
      } else {
        setTopTodayEvent(null);
      }
    }
  }, [displayEvents]);

  const eventsByDate = React.useMemo(() => {
    const grouped = groupEventsByDate(regularEvents);
    
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
  }, [regularEvents]);

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
    <div className="dark-glass-card rounded-xl p-3 overflow-hidden w-full max-w-full">
      <div className="flex items-center justify-between mb-2">
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
          <div className="flex items-center gap-1 bg-green-600/20 px-2 py-0.5 rounded-full">
            <span className="text-green-400 text-xs font-bold">NEW</span>
            <span className="text-green-400 text-xs font-medium">{newEventIds.size}</span>
          </div>
        )}
      </div>
      
      <div ref={listRef} className="overflow-y-auto max-h-[650px] pr-1 scrollbar-thin w-full">
        {Object.keys(eventsByDate).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-2 gap-y-3">
            {hochschulsportEvents.length > 0 && (
              <div className="col-span-full mb-2">
                <Collapsible 
                  open={isHochschulsportOpen} 
                  onOpenChange={setIsHochschulsportOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-2 bg-blue-900/20 hover:bg-blue-900/30 transition-colors rounded-lg w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">Hochschulsport Events</span>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                          {hochschulsportEvents.length}
                        </span>
                      </div>
                      {isHochschulsportOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {hochschulsportEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        compact={true}
                        onClick={() => onSelectEvent(event, new Date(event.date))}
                        onLike={onLike}
                        className="border-l-2 border-blue-500"
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
            
            {Object.keys(eventsByDate).sort().map(dateStr => {
              const date = parseISO(dateStr);
              const isCurrentDay = isToday(date);
              const hasNewEvents = eventsByDate[dateStr].some(event => newEventIds.has(event.id));
              
              return (
                <div 
                  key={dateStr} 
                  ref={isCurrentDay ? todayRef : null}
                  className={`w-full ${isCurrentDay ? 'scroll-mt-12' : ''}`}
                  id={isCurrentDay ? "today-section" : undefined}
                >
                  <h4 className="text-sm font-medium mb-1 text-white sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-1 z-10 rounded-md flex items-center w-full">
                    {format(date, 'EEEE, d. MMMM', { locale: de })}
                    {hasNewEvents && (
                      <span className="ml-1 text-[10px] bg-green-600 text-white px-1 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="font-bold">NEW</span>
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1 w-full">
                    {eventsByDate[dateStr].map((event, eventIndex) => {
                      const isTopEvent = isCurrentDay && topTodayEvent && event.id === topTodayEvent.id;
                      const isNewEvent = newEventIds.has(event.id);
                      
                      return (
                        <div key={event.id} className={`relative ${isTopEvent ? 'transform transition-all' : ''} w-full`}>
                          {isTopEvent && (
                            <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-[#E53935] to-[#C62828] rounded-full"></div>
                          )}
                          {isNewEvent && !isTopEvent && (
                            <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-700 rounded-full"></div>
                          )}
                          <div className={`${isTopEvent ? 'bg-gradient-to-r from-[#C62828]/20 to-transparent rounded-lg w-full' : isNewEvent ? 'bg-gradient-to-r from-green-600/10 to-transparent rounded-lg w-full' : 'w-full'}`}>
                            {isTopEvent && (
                              <div className="absolute right-1 top-1 bg-[#E53935] text-white px-1 py-0.5 rounded-full text-[10px] flex items-center z-20">
                                <Star className="w-2 h-2 mr-0.5 fill-white" />
                                <span>Top</span>
                              </div>
                            )}
                            <EventCard 
                              key={event.id} 
                              event={event}
                              compact={true}
                              onClick={() => onSelectEvent(event, date)}
                              onLike={onLike}
                              className={`${isTopEvent ? 'border-l-2 border-[#E53935]' : isNewEvent ? 'border-l-2 border-green-500' : ''} relative w-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 w-full">
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
