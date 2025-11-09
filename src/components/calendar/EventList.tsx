import React, { useRef, useEffect, useState, memo, useMemo, useCallback } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, Heart, Filter, FilterX, Plus } from 'lucide-react';
import FilterBar, { type FilterGroup } from '@/components/calendar/FilterBar';
import { isInGroup, CategoryGroup } from '@/utils/eventCategoryGroups';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

interface EventListProps {
  events: Event[];
  showFavorites: boolean;
  showNewEvents?: boolean;
  onSelectEvent: (event: Event, date: Date) => void;
  toggleFavorites: () => void;
  toggleNewEvents: () => void;
  favoriteCount?: number;
  onShowEventForm?: () => void;
  onDislike?: (eventId: string) => void;
  filter?: string | null;
  topEventsPerDay?: Record<string, string>;
  activeCategory?: string;
}


const MemoizedEventCard = memo(({ event, date, onSelectEvent, isTopEvent, isNewEvent, onDislike }: {
  event: Event;
  date: Date;
  onSelectEvent: (event: Event, date: Date) => void;
  isTopEvent: boolean;
  isNewEvent: boolean;
  onDislike?: (eventId: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelectEvent(event, date);
  }, [event, date, onSelectEvent]);

  return (
    <div key={event.id} className={`relative ${isTopEvent ? 'transform transition-all' : ''} w-full`}>
      {isTopEvent && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-white to-gray-300 rounded-full"></div>
      )}
      {isNewEvent && !isTopEvent && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full"></div>
      )}
      <div className={`${isTopEvent ? 'bg-gradient-to-r from-white/10 to-transparent rounded-lg w-full' : isNewEvent ? 'bg-gradient-to-r from-gray-600/10 to-transparent rounded-lg w-full' : 'w-full'}`}>
      {isTopEvent && (
        <div className="absolute right-1 top-1 bg-white text-black px-1 py-0.5 rounded-full text-[10px] flex items-center z-20">
          <Star className="w-2 h-2 mr-0.5 fill-black" />
          <span>Top</span>
        </div>
      )}
        <EventCard 
          event={event}
          compact={true}
          onClick={handleClick}
          className={`${isTopEvent ? 'border-l-2 border-white' : isNewEvent ? 'border-l-2 border-gray-400' : ''} relative w-full`}
          monochrome
          onDislike={onDislike}
        />
      </div>
    </div>
  );
});

MemoizedEventCard.displayName = 'MemoizedEventCard';

const EventList: React.FC<EventListProps> = memo(({
  events,
  showFavorites,
  showNewEvents = false,
  onSelectEvent,
  toggleFavorites,
  toggleNewEvents,
  favoriteCount = 0,
  onShowEventForm,
  onDislike,
  filter = null,
  topEventsPerDay = {},
  activeCategory = 'alle'
}) => {
  console.log('📋 [EventList] Rendering with events.length:', events.length, 'showFavorites:', showFavorites);
  
  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  
  const [topTodayEvent, setTopTodayEvent] = useState<Event | null>(null);
  const groupFilter = activeCategory as FilterGroup;
  const categories = useMemo(() => Array.from(new Set(events.map(e => e.category).filter(Boolean))) as string[], [events]);

  const filteredEvents = useMemo(() => {
    let base = events;

    if (groupFilter !== 'alle') {
      // Map FilterGroup to CategoryGroup for filtering
      const categoryGroupMap: Record<FilterGroup, CategoryGroup | null> = {
        'alle': null,
        'ausgehen': 'Ausgehen',
        'sport': 'Sport',
        'kreativität': 'Kreativität'
      };
      
      const targetCategoryGroup = categoryGroupMap[groupFilter];
      if (targetCategoryGroup) {
        base = base.filter((event) => isInGroup(event.category, targetCategoryGroup));
      }
    } else if (filter) {
      // If context filter matches a group label, map categories; otherwise, use category equality
      const isGroup = filter === 'ausgehen' || filter === 'kreativität' || filter === 'sport';
      base = base.filter((event) =>
        isGroup ? isInGroup(event.category, filter as any) : event.category === filter
      );
    }

    return base;
  }, [events, filter, groupFilter]);

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



    return (
      <div className="bg-white text-black rounded-3xl border border-gray-200 shadow-xl p-4 overflow-hidden w-full max-w-full -mt-4">
        <div className="flex items-center mb-2 gap-2 overflow-x-auto">
          <FilterBar value={groupFilter} className="min-w-max" variant="light" />
        </div>
        
        <div ref={listRef} className="overflow-y-auto max-h-[650px] pr-1 scrollbar-thin w-full mt-2">
        {Object.keys(eventsByDate).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-2 gap-y-1">
            {Object.keys(eventsByDate).sort().map(dateStr => {
              const date = parseISO(dateStr);
              const isCurrentDay = isToday(date);
              
              return (
                <div 
                  key={dateStr} 
                  ref={isCurrentDay ? todayRef : null}
                  className={`w-full ${isCurrentDay ? 'scroll-mt-12' : ''}`}
                  id={isCurrentDay ? "today-section" : undefined}
                >
                  <h4 className="text-sm font-semibold mb-1 text-gray-900 sticky top-0 bg-white py-1 z-10 flex items-center w-full border-b border-gray-200">
                    {format(date, 'EEEE, d. MMMM', { locale: de })}
                  </h4>
                  <div className="space-y-0.5 w-full">
                    {eventsByDate[dateStr].map((event) => {
                      const isTopEvent = isCurrentDay && topTodayEvent && event.id === topTodayEvent.id;
                      const isNewEvent = false; // No new events tracking for now
                      
                      return (
                        <MemoizedEventCard
                          key={event.id}
                          event={event}
                          date={date}
                          onSelectEvent={onSelectEvent}
                          isTopEvent={isTopEvent}
                          isNewEvent={isNewEvent}
                          onDislike={onDislike}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500 w-full">
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
