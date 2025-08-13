import React, { useRef, useEffect, useState, memo, useMemo, useCallback } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import { groupEventsByDate } from '@/utils/eventUtils';
import { Star, Heart, Filter, FilterX, Plus } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import FilterBar, { type FilterGroup } from '@/components/calendar/FilterBar';
import { isInGroup } from '@/utils/eventCategoryGroups';
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
}


const MemoizedEventCard = memo(({ event, date, onSelectEvent, isTopEvent, isNewEvent }: {
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
  onShowEventForm
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  
  const [topTodayEvent, setTopTodayEvent] = useState<Event | null>(null);
const { filter, setFilter, topEventsPerDay } = useEventContext();
const [groupFilter, setGroupFilter] = useState<FilterGroup>('Alle');
const categories = useMemo(() => Array.from(new Set(events.map(e => e.category).filter(Boolean))) as string[], [events]);

  const filteredEvents = useMemo(() => {
    let base = events;

    if (groupFilter !== 'Alle') {
      base = base.filter((event) => isInGroup(event.category, groupFilter as any));
    } else if (filter) {
      // If context filter matches a group label, map categories; otherwise, use category equality
      const isGroup = filter === 'Ausgehen' || filter === 'Kreativität' || filter === 'Sport';
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
      <div className="bg-white text-black rounded-3xl border border-gray-200 shadow-xl p-4 overflow-hidden w-full max-w-full">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {showFavorites 
              ? "Top Events" 
              : showNewEvents 
                ? "Neue Events" 
                : groupFilter !== 'Alle'
                  ? `${groupFilter} Events`
                  : filter 
                    ? `${filter} Events` 
                    : "Alle Events"}
          </h3>
          <div className="flex items-center gap-2">
            <FilterBar value={groupFilter} onChange={(v) => setGroupFilter(v)} variant="light" />
            <div className="inline-flex rounded-full p-0.5 bg-white/80 border border-gray-200">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFavorites}
                className={`${showFavorites ? 'bg-gray-900 text-white hover:bg-gray-900' : 'text-gray-700 hover:bg-gray-100'} px-3 h-7 text-xs rounded-full transition-colors`}
                aria-label="Favoriten"
              >
                <Heart className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Favoriten</span>
                {!showFavorites && favoriteCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {favoriteCount}
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleNewEvents}
                className={`${showNewEvents ? 'bg-gray-900 text-white hover:bg-gray-900' : 'text-gray-700 hover:bg-gray-100'} px-3 h-7 text-xs rounded-full transition-colors`}
                aria-label="Neue Events"
              >
                <span className="font-semibold">NEW</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`${filter ? 'bg-gray-900 text-white hover:bg-gray-900' : 'text-gray-700 hover:bg-gray-100'} px-3 h-7 text-xs rounded-full transition-colors`}
                    aria-label="Filter"
                  >
                    {filter ? <FilterX className="w-3 h-3 mr-1" /> : <Filter className="w-3 h-3 mr-1" />}
                    <span className="hidden sm:inline">{filter || 'Filter'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-black border border-gray-200 rounded-xl p-2 shadow-xl min-w-48 z-50">
                  <DropdownMenuLabel className="text-center text-gray-700">Veranstaltungstyp</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  {filter && (
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onSelect={(e) => {
                        e.preventDefault();
                        setFilter(null);
                      }}
                      className="cursor-pointer hover:bg-gray-100 rounded-lg flex items-center gap-2"
                    >
                      <FilterX className="h-4 w-4 mr-1" />
                      Alle anzeigen
                    </DropdownMenuCheckboxItem>
                  )}
                  {categories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat as string}
                      checked={filter === cat}
                      onSelect={(e) => {
                        e.preventDefault();
                        setFilter((prev) => (prev === cat ? null : (cat as string)));
                      }}
                      className="cursor-pointer hover:bg-gray-100 rounded-lg flex items-center gap-2"
                    >
                      {cat as string}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {onShowEventForm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onShowEventForm}
                  className="px-3 h-7 text-xs rounded-full transition-colors text-gray-700 hover:bg-gray-100"
                  aria-label="Neues Event"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div ref={listRef} className="overflow-y-auto max-h-[650px] pr-1 scrollbar-thin w-full">
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
