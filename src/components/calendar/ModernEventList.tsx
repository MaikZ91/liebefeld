import React, { useRef, useEffect, useState, memo, useMemo, useCallback } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, Clock, MapPin, Users, Calendar } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { Badge } from '@/components/ui/badge';

interface EventListProps {
  events: Event[];
  showFavorites: boolean;
  showNewEvents?: boolean;
  onSelectEvent: (event: Event, date: Date) => void;
}

const ModernEventCard = memo(({ event, date, onSelectEvent, isTopEvent, isNewEvent }: {
  event: Event;
  date: Date;
  onSelectEvent: (event: Event, date: Date) => void;
  isTopEvent: boolean;
  isNewEvent: boolean;
}) => {
  const handleClick = useCallback(() => {
    onSelectEvent(event, date);
  }, [event, date, onSelectEvent]);

  return (
    <div 
      className={`modern-event-card p-4 cursor-pointer group relative overflow-hidden ${
        isTopEvent ? 'border-primary ring-1 ring-primary/20' : ''
      } ${isNewEvent ? 'border-green-500/50 ring-1 ring-green-500/20' : ''}`}
      onClick={handleClick}
    >
      {/* Top indicator */}
      {isTopEvent && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Top
        </div>
      )}
      
      {/* Event image or fallback */}
      <div className="w-full h-32 rounded-md bg-muted mb-3 overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Event content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          {event.likes && event.likes > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>{event.likes} Likes</span>
            </div>
          )}
        </div>

        {/* Category badge */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {event.category}
          </Badge>
          {event.is_paid && (
            <Badge variant="outline" className="text-xs">
              Kostenpflichtig
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

ModernEventCard.displayName = 'ModernEventCard';

const ModernEventList: React.FC<EventListProps> = memo(({
  events,
  showFavorites,
  showNewEvents = false,
  onSelectEvent
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  const [topTodayEvent, setTopTodayEvent] = useState<Event | null>(null);
  const { filter, topEventsPerDay } = useEventContext();

  const filteredEvents = useMemo(() => {
    if (!filter) return events;
    return events.filter(event => event.category === filter);
  }, [events, filter]);

  const displayEvents = useMemo(() => {
    if (!showFavorites) return filteredEvents;
    
    return filteredEvents.filter(event => {
      if (!event.date) return false;
      const eventLikes = event.likes || 0;
      return topEventsPerDay[event.date] === event.id && eventLikes > 0;
    });
  }, [filteredEvents, showFavorites, topEventsPerDay]);

  const eventsByDate = useMemo(() => {
    const grouped = groupEventsByDate(filteredEvents);
    
    Object.keys(grouped).forEach(dateStr => {
      grouped[dateStr].sort((a, b) => {
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        
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
  }, [filteredEvents]);
  
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

  useEffect(() => {
    if (todayRef.current && listRef.current && !hasScrolledToToday && Object.keys(eventsByDate).length > 0) {
      const scrollTimer = setTimeout(() => {
        if (todayRef.current && listRef.current) {
          const targetScrollTop = todayRef.current.offsetTop - 80;
          listRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
          setHasScrolledToToday(true);
        }
      }, 1000);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [eventsByDate, hasScrolledToToday]);

  useEffect(() => {
    setHasScrolledToToday(false);
  }, [showFavorites, showNewEvents, filter]);

  return (
    <div className="modern-event-container p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {showFavorites 
            ? "Top Events" 
            : showNewEvents 
              ? "Neue Events" 
              : filter 
                ? `${filter} Events` 
                : "Alle Events"}
        </h2>
        <div className="text-sm text-muted-foreground">
          {Object.values(eventsByDate).flat().length} Events
        </div>
      </div>
      
      <div ref={listRef} className="overflow-y-auto max-h-[calc(100vh-200px)] pr-2 scrollbar-thin">
        {Object.keys(eventsByDate).length > 0 ? (
          <div className="space-y-8">
            {Object.keys(eventsByDate).sort().map(dateStr => {
              const date = parseISO(dateStr);
              const isCurrentDay = isToday(date);
              
              return (
                <div 
                  key={dateStr} 
                  ref={isCurrentDay ? todayRef : null}
                  className="space-y-4"
                >
                  <div className={`sticky top-0 z-10 py-2 ${isCurrentDay ? 'bg-primary text-primary-foreground' : 'bg-background'} rounded-lg px-4 border-l-4 ${isCurrentDay ? 'border-primary' : 'border-border'}`}>
                    <h3 className={`text-lg font-semibold ${isCurrentDay ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {format(date, 'EEEE, d. MMMM', { locale: de })}
                    </h3>
                    <p className={`text-sm ${isCurrentDay ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {eventsByDate[dateStr].length} Event{eventsByDate[dateStr].length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {eventsByDate[dateStr].map((event) => {
                      const isTopEvent = isCurrentDay && topTodayEvent && event.id === topTodayEvent.id;
                      const isNewEvent = false; // No new events tracking for now
                      
                      return (
                        <ModernEventCard
                          key={event.id}
                          event={event}
                          date={date}
                          onSelectEvent={onSelectEvent}
                          isTopEvent={isTopEvent}
                          isNewEvent={isNewEvent}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <Calendar className="w-16 h-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {showFavorites 
                  ? "Keine Favoriten" 
                  : showNewEvents
                    ? "Keine neuen Events"
                    : filter
                      ? `Keine ${filter} Events`
                      : "Keine Events"}
              </h3>
              <p className="text-muted-foreground">
                {showFavorites 
                  ? "Du hast noch keine Events als Favoriten markiert." 
                  : showNewEvents
                    ? "Es wurden keine neuen Events gefunden."
                    : filter
                      ? `Aktuell sind keine Events in der Kategorie ${filter} verfügbar.`
                      : "Aktuell sind keine Events verfügbar."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ModernEventList.displayName = 'ModernEventList';

export default ModernEventList;