// src/components/calendar/EventList.tsx

import React, { useRef, useEffect, useState, memo, useMemo } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { useLikeSync } from '@/hooks/useLikeSync';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface EventListProps {
  events: Event[];
  showFavorites: boolean;
  showNewEvents?: boolean;
  onSelectEvent: (event: Event, date: Date) => void;
  onLike: (eventId: string) => void;
}

// Memoized EventCard component wrapper to prevent unnecessary re-renders
const MemoizedEventCard = memo(({ event, date, onSelectEvent, onLike, isTopEvent, isNewEvent }: {
  event: Event;
  date: Date;
  onSelectEvent: (event: Event, date: Date) => void;
  onLike: (eventId: string) => void;
  isTopEvent: boolean;
  isNewEvent: boolean;
}) => (
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
        event={event}
        compact={true}
        onClick={() => onSelectEvent(event, date)}
        onLike={onLike}
        className={`${isTopEvent ? 'border-l-2 border-[#E53935]' : isNewEvent ? 'border-l-2 border-green-500' : ''} relative w-full`}
      />
    </div>
  </div>
));

MemoizedEventCard.displayName = 'MemoizedEventCard';

const EventList: React.FC<EventListProps> = memo(({
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
  const { eventLikes } = useLikeSync(); // Use the sync hook

  // Memoize expensive computations with better like synchronization
  const { hochschulsportEvents, regularEvents } = useMemo(() => {
    const hochschulsport = events.filter(event => 
      event.title.toLowerCase().includes('hochschulsport') || 
      event.organizer?.toLowerCase().includes('hochschulsport') ||
      event.title.toLowerCase().includes('@hochschulsport_bielefeld') ||
      event.organizer?.toLowerCase().includes('@hochschulsport_bielefeld')
    );
    
    const regular = events.filter(event => 
      !event.title.toLowerCase().includes('hochschulsport') && 
      !event.organizer?.toLowerCase().includes('hochschulsport') &&
      !event.title.toLowerCase().includes('@hochschulsport_bielefeld') &&
      !event.organizer?.toLowerCase().includes('@hochschulsport_bielefeld')
    );
    
    return { hochschulsportEvents: hochschulsport, regularEvents: regular };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!filter) return events;
    return events.filter(event => event.category === filter);
  }, [events, filter]);

  const displayEvents = useMemo(() => {
    if (!showFavorites) return filteredEvents;
    
    // For favorites, use synced likes data
    return filteredEvents.filter(event => {
      if (!event.date) return false;
      
      const eventLikesCount = event.id.startsWith('github-')
        ? (eventLikes[event.id] || 0)
        : Math.max(eventLikes[event.id] || 0, event.likes || 0);
      
      return topEventsPerDay[event.date] === event.id && eventLikesCount > 0;
    });
  }, [filteredEvents, showFavorites, topEventsPerDay, eventLikes]);

  const eventsByDate = useMemo(() => {
    const grouped = groupEventsByDate(regularEvents);
    
    // Pre-sort events within each date group with updated likes
    Object.keys(grouped).forEach(dateStr => {
      grouped[dateStr].sort((a, b) => {
        // Get updated likes for sorting
        const likesA = a.id.startsWith('github-')
          ? (eventLikes[a.id] || 0)
          : Math.max(eventLikes[a.id] || 0, a.likes || 0);
        const likesB = b.id.startsWith('github-')
          ? (eventLikes[b.id] || 0)
          : Math.max(eventLikes[b.id] || 0, b.likes || 0);
        
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        
        // Then sort by time (ascending)
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        
        const [hourA, minuteA] = timeA.split(':').map(Number);
        const [hourB, minuteB] = timeB.split(':').map(Number);
        
        if (hourA !== hourB) {
          return hourA - hourB;
        }
        if (minuteA !== minuteB) {
          return minuteA - minuteB;
        }
        
        return a.id.localeCompare(b.id);
      });
    });
    
    return grouped;
  }, [regularEvents, eventLikes]);
  
  const hochschulsportEventsByDate = useMemo(() => {
    // Also sort Hochschulsport events by time
    const grouped = groupEventsByDate(hochschulsportEvents);
    Object.keys(grouped).forEach(dateStr => {
      grouped[dateStr].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        
        const [hourA, minuteA] = timeA.split(':').map(Number);
        const [hourB, minuteB] = timeB.split(':').map(Number);
        
        if (hourA !== hourB) {
          return hourA - hourB;
        }
        if (minuteA !== minuteB) {
          return minuteA - minuteB;
        }
        
        return a.id.localeCompare(b.id);
      });
    });
    return grouped;
  }, [hochschulsportEvents]);

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
          // Use updated likes for determining top event
          const likesA = a.id.startsWith('github-')
            ? (eventLikes[a.id] || 0)
            : Math.max(eventLikes[a.id] || 0, a.likes || 0);
          const likesB = b.id.startsWith('github-')
            ? (eventLikes[b.id] || 0)
            : Math.max(eventLikes[b.id] || 0, b.likes || 0);
          
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
  }, [displayEvents, eventLikes]);

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
      <div className="flex items-center justify-between mb-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-2 gap-y-1">
            {Object.keys(eventsByDate).sort().map(dateStr => {
              const date = parseISO(dateStr);
              const isCurrentDay = isToday(date);
              const hasNewEvents = eventsByDate[dateStr].some(event => newEventIds.has(event.id));
              const hasHochschulsportEvents = hochschulsportEventsByDate[dateStr] && hochschulsportEventsByDate[dateStr].length > 0;
              
              return (
                <div 
                  key={dateStr} 
                  ref={isCurrentDay ? todayRef : null}
                  className={`w-full ${isCurrentDay ? 'scroll-mt-12' : ''}`}
                  id={isCurrentDay ? "today-section" : undefined}
                >
                  <h4 className="text-sm font-medium mb-0.5 text-white sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-0.5 z-10 rounded-md flex items-center w-full">
                    {format(date, 'EEEE, d. MMMM', { locale: de })}
                    {hasNewEvents && (
                      <span className="ml-1 text-[10px] bg-green-600 text-white px-1 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="font-bold">NEW</span>
                      </span>
                    )}
                  </h4>
                  <div className="space-y-0.5 w-full">
                    {eventsByDate[dateStr].map((event) => {
                      const isTopEvent = isCurrentDay && topTodayEvent && event.id === topTodayEvent.id;
                      const isNewEvent = newEventIds.has(event.id);
                      
                      return (
                        <MemoizedEventCard
                          key={event.id}
                          event={event}
                          date={date}
                          onSelectEvent={onSelectEvent}
                          onLike={onLike}
                          isTopEvent={isTopEvent}
                          isNewEvent={isNewEvent}
                        />
                      );
                    })}
                    
                    {hasHochschulsportEvents && (
                      <Accordion type="single" collapsible className="w-full mt-2">
                        <AccordionItem value="hochschulsport" className="border-none">
                          <AccordionTrigger className="py-2 px-3 bg-blue-900/20 hover:bg-blue-900/30 transition-colors rounded-lg text-white">
                            <div className="flex items-center">
                              <span className="font-medium">@hochschulsport_bielefeld</span>
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-2">
                                {hochschulsportEventsByDate[dateStr].length}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pt-2">
                            <div className="space-y-1 pl-2">
                              {hochschulsportEventsByDate[dateStr].map(event => (
                                <EventCard
                                  key={event.id}
                                  event={event}
                                  compact={true}
                                  onClick={() => onSelectEvent(event, date)}
                                  onLike={onLike}
                                  className="border-l-2 border-blue-500"
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
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
});

EventList.displayName = 'EventList';

export default EventList;
