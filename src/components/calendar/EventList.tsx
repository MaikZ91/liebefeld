import React, { useRef, useEffect, useState, memo, useMemo, useCallback } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, Flame, Clock, MapPin, Heart, Users } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EventListProps {
  events: Event[];
  showFavorites: boolean;
  showNewEvents?: boolean;
  onSelectEvent: (event: Event, date: Date) => void;
}

interface ExtendedEventListProps extends EventListProps {
  setShowFavorites?: (value: boolean) => void;
  setShowNewEvents?: (value: boolean) => void;
}

const ModernEventCard = memo(({ event, date, onSelectEvent, isTopEvent, isNewEvent }: {
  event: Event;
  date: Date;
  onSelectEvent: (event: Event, date: Date) => void;
  isTopEvent: boolean;
  isNewEvent: boolean;
}) => {
  const { handleLikeEvent } = useEventContext();
  const [isLiking, setIsLiking] = useState(false);
  
  const handleClick = useCallback(() => {
    onSelectEvent(event, date);
  }, [event, date, onSelectEvent]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking || !event?.id) return;
    
    setIsLiking(true);
    await handleLikeEvent(event.id);
    setTimeout(() => setIsLiking(false), 250);
  };

  const currentLikes = event.likes || 0;
  const rsvpCount = Math.floor(Math.random() * 20) + 1; // Simulated RSVP count

  return (
    <div 
      className="bg-gray-800/50 rounded-xl p-4 mb-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        {/* Event Image */}
        <div className="flex-shrink-0">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-lg truncate">{event.title}</h3>
            {isNewEvent && (
              <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                N Neu
              </Badge>
            )}
            {isTopEvent && (
              <Badge className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Top
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-gray-300 text-sm">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{event.time}</span>
              <span>•</span>
              <span>{event.location}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">{rsvpCount} Zusagen</span>
          </div>
        </div>

        {/* Like Section */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors"
          >
            <Heart className={`w-5 h-5 ${currentLikes > 0 ? 'fill-current' : ''}`} />
            <span className="text-white font-medium">{currentLikes}</span>
          </button>
          
          {/* User Avatars */}
          {event.liked_by_users && event.liked_by_users.length > 0 && (
            <div className="flex -space-x-2">
              {event.liked_by_users.slice(0, 3).map((user, index) => (
                <div 
                  key={index} 
                  className="w-6 h-6 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs text-white"
                >
                  {user.username?.[0] || '?'}
                </div>
              ))}
              {event.liked_by_users.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs text-white">
                  {event.liked_by_users.length - 3}+
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Additional Info */}
        <div className="text-right text-gray-400 text-sm">
          <div>AN AN -17</div>
        </div>
      </div>
    </div>
  );
});

ModernEventCard.displayName = 'ModernEventCard';

const EventList: React.FC<EventListProps> = memo(({
  events,
  showFavorites,
  showNewEvents = false,
  onSelectEvent
}) => {
  const [localShowFavorites, setLocalShowFavorites] = useState(showFavorites);
  const [localShowNewEvents, setLocalShowNewEvents] = useState(showNewEvents);
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
      console.log('EventList: Waiting for animations to complete before scrolling to today');
      
      const scrollTimer = setTimeout(() => {
        if (todayRef.current && listRef.current) {
          const targetScrollTop = todayRef.current.offsetTop - 80;
          const currentScrollTop = listRef.current.scrollTop;
          
          const duration = 800;
          const startTime = performance.now();
          
          const animateScroll = (currentTime: number) => {
            if (!listRef.current) {
              return; // Guard against component unmount
            }
            
            const elapsedTime = currentTime - startTime;
            
            if (elapsedTime < duration) {
              const progress = 1 - Math.pow(1 - elapsedTime / duration, 2);
              const scrollValue = currentScrollTop + (targetScrollTop - currentScrollTop) * progress;
              listRef.current.scrollTop = scrollValue;
              requestAnimationFrame(animateScroll);
            } else {
              listRef.current.scrollTop = targetScrollTop;
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
    <div className="bg-black min-h-screen text-white">
      {/* Filter Tabs */}
      <div className="flex gap-4 px-4 py-4 border-b border-gray-800">
        <Button 
          variant={localShowFavorites ? "default" : "ghost"}
          onClick={() => {
            setLocalShowFavorites(true);
            setLocalShowNewEvents(false);
          }}
          className="flex items-center gap-2 text-sm"
        >
          <Star className="w-4 h-4 fill-current text-yellow-500" />
          Für dich
        </Button>
        <Button 
          variant={(!localShowFavorites && !localShowNewEvents) ? "default" : "ghost"}
          onClick={() => {
            setLocalShowFavorites(false);
            setLocalShowNewEvents(false);
          }}
          className="flex items-center gap-2 text-sm"
        >
          <Flame className="w-4 h-4 text-orange-500" />
          Beliebt
        </Button>
        <Button 
          variant={localShowNewEvents ? "default" : "ghost"}
          onClick={() => {
            setLocalShowNewEvents(true);
            setLocalShowFavorites(false);
          }}
          className="flex items-center gap-2 text-sm"
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">N</div>
          Neu
        </Button>
        <Button 
          variant="ghost"
          className="flex items-center gap-2 text-sm"
        >
          🎉 Heute
        </Button>
      </div>

      {/* Date Display */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-300">
            {format(new Date(), 'dd. MMMM yyyy • EEEE', { locale: de })}
          </span>
        </div>
      </div>
      
      {/* Events List */}
      <div ref={listRef} className="overflow-y-auto px-4 py-4">
        {Object.keys(eventsByDate).length > 0 ? (
          <div className="space-y-2">
            {Object.keys(eventsByDate).sort().map(dateStr => {
              const date = parseISO(dateStr);
              const isCurrentDay = isToday(date);
              
              return (
                <div key={dateStr} ref={isCurrentDay ? todayRef : null}>
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
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            {localShowFavorites 
              ? "Du hast noch keine Favoriten" 
              : localShowNewEvents
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
