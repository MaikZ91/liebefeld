import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Music, PartyPopper, Image, Dumbbell, Map, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Event } from '@/types/eventTypes';
import { getEventsForDay, getMonthOrFavoriteEvents } from '@/utils/eventUtils';
import { normalizeDate } from '@/utils/dateUtils';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarDays from './calendar/CalendarDays';
import EventList from './calendar/EventList';
import EventPanel from './calendar/EventPanel';
import FavoritesView from './calendar/FavoritesView';
import EventForm from './EventForm';
import { useEventContext } from '@/contexts/EventContext';
import { toast } from 'sonner';

interface EventCalendarProps {
  defaultView?: "calendar" | "list";
}

// Category icons mapping
const categoryIcons = {
  "Konzert": <Music className="h-4 w-4" />,
  "Party": <PartyPopper className="h-4 w-4" />,
  "Ausstellung": <Image className="h-4 w-4" />,
  "Sport": <Dumbbell className="h-4 w-4" />,
  "Workshop": <Plus className="h-4 w-4" />,
  "Kultur": <Image className="h-4 w-4" />,
  "Sonstiges": <Map className="h-4 w-4" />
};

const EventCalendar = ({ defaultView = "list" }: EventCalendarProps) => {
  // Get shared state from context
  const { 
    events, 
    selectedDate, 
    setSelectedDate, 
    selectedEvent, 
    setSelectedEvent,
    filter,
    setFilter,
    handleLikeEvent,
    showFavorites,
    setShowFavorites,
    eventLikes,
    refreshEvents,
    newEventIds,
    topEventsPerDay,
    addUserEvent
  } = useEventContext();

  // Local state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">(defaultView);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showNewEvents, setShowNewEvents] = useState(false);
  
  // Calendar navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get events for the current month, favorites, or new events
  const eventsToDisplay = React.useMemo(() => {
    if (showNewEvents) {
      return events.filter(event => newEventIds.has(event.id));
    } else if (showFavorites) {
      // For favorites, return only the top events for each day that have at least one like
      return events.filter(event => 
        event.date && 
        topEventsPerDay[event.date] === event.id && 
        (event.likes && event.likes > 0)
      );
    } else {
      return getMonthOrFavoriteEvents(events, currentDate, false, eventLikes);
    }
  }, [events, currentDate, showFavorites, eventLikes, showNewEvents, newEventIds, topEventsPerDay]);
  
  // Filter events for the selected date and category filter
  const filteredEvents = selectedDate 
    ? getEventsForDay(events, selectedDate, filter)
    : [];
    
  // Get user's favorite events (top events per day with likes > 0)
  const favoriteEvents = React.useMemo(() => {
    return events.filter(event => 
      event.date && 
      topEventsPerDay[event.date] === event.id && 
      (event.likes && event.likes > 0)
    );
  }, [events, topEventsPerDay]);

  // Handle selecting a date
  const handleDateClick = (day: Date) => {
    // Normalize the date to the start of day
    const normalizedDay = normalizeDate(day);
    console.log(`Selecting date: ${normalizedDay.toISOString()}`);
    setSelectedDate(normalizedDay);
    setSelectedEvent(null);
  };
  
  // Handle selecting an event
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };
  
  // Handler for adding a new event - only passes to the context method
  const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      console.log('Adding new event to database only:', newEvent);
      await addUserEvent(newEvent);
      toast.success("Event erfolgreich hinzugefügt!");
      setShowEventForm(false);
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error("Fehler beim Hinzufügen des Events");
    }
  };

  // Toggle category filter
  const toggleFilter = (category: string) => {
    setFilter(current => current === category ? null : category);
  };

  // Toggle favorites view
  const toggleFavorites = () => {
    if (showNewEvents) setShowNewEvents(false);
    setShowFavorites(prev => !prev);
    
    // Reset date selection when toggling favorites
    if (!showFavorites) {
      setSelectedDate(null);
    }
  };
  
  // Toggle new events view
  const toggleNewEvents = () => {
    if (showFavorites) setShowFavorites(false);
    setShowNewEvents(prev => !prev);
    
    // Reset date selection when toggling new events view
    if (!showNewEvents) {
      setSelectedDate(null);
    }
  };

  // Toggle event form visibility
  const toggleEventForm = () => {
    setShowEventForm(prev => !prev);
  };

  // When a filter is applied, reset date selection
  useEffect(() => {
    if (filter !== null) {
      setSelectedDate(null);
    }
  }, [filter]);

  return (
    <div className="container mx-auto px-2 py-6 max-w-[1280px] animate-fade-in">
      <div className="flex flex-col space-y-4">
        {/* Calendar header with month navigation */}
        <CalendarHeader 
          currentDate={currentDate}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          showFavorites={showFavorites}
          toggleFavorites={toggleFavorites}
          favoriteEvents={favoriteEvents.length}
          filter={filter}
          toggleFilter={toggleFilter}
          categories={Array.from(new Set(events.map(event => event.category)))}
          categoryIcons={categoryIcons}
          showNewEvents={showNewEvents}
          toggleNewEvents={toggleNewEvents}
          newEventsCount={newEventIds.size}
          view={view}
          setView={setView}
          onShowEventForm={toggleEventForm}
          showEventForm={showEventForm}
        />

        {/* Event form between menu and calendar */}
        {showEventForm && (
          <div className="w-full mt-3 mb-3 dark-glass-card rounded-xl p-4 animate-fade-down animate-duration-300">
            <EventForm 
              selectedDate={selectedDate ? selectedDate : new Date()} 
              onAddEvent={handleAddEvent}
              onCancel={() => setShowEventForm(false)}
            />
          </div>
        )}
        
        {/* Main calendar and list views */}
        <Tabs 
          defaultValue={view} 
          value={view} 
          className="flex flex-col items-center w-full"
        >
          <TabsContent value="list" className="w-full">
            <EventList 
              events={eventsToDisplay}
              showFavorites={showFavorites}
              showNewEvents={showNewEvents}
              onSelectEvent={(event, date) => {
                setSelectedDate(date);
                setSelectedEvent(event);
              }}
              onLike={handleLikeEvent}
            />
          </TabsContent>
          
          <TabsContent value="calendar" className="w-full">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="w-full md:w-3/5 dark-glass-card rounded-xl p-4">
                {showFavorites ? (
                  <FavoritesView 
                    favoriteEvents={favoriteEvents}
                    onSwitchToList={() => setView("list")}
                  />
                ) : showNewEvents ? (
                  <div className="text-center p-3">
                    <h3 className="text-base font-medium mb-2">Neue Events</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Es gibt {newEventIds.size} neue Events seit deinem letzten Besuch.
                    </p>
                    <Button onClick={() => setView("list")} size="sm" className="text-xs h-7 px-2">
                      Als Liste anzeigen
                    </Button>
                  </div>
                ) : (
                  <CalendarDays 
                    daysInMonth={daysInMonth}
                    events={filter ? events.filter(event => event.category === filter) : events}
                    selectedDate={selectedDate}
                    onDateClick={handleDateClick}
                  />
                )}
              </div>
              
              {/* Event details panel */}
              <div className="w-full md:w-2/5 mt-3 md:mt-0">
                <EventPanel 
                  selectedDate={selectedDate}
                  selectedEvent={selectedEvent}
                  filteredEvents={filteredEvents}
                  filter={filter}
                  onEventSelect={handleEventSelect}
                  onEventClose={() => setSelectedEvent(null)}
                  onLike={handleLikeEvent}
                  onShowEventForm={toggleEventForm}
                  showFavorites={showFavorites}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventCalendar;
export type { Event };
