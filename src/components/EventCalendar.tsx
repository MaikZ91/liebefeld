
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
    newEventIds
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
    } else {
      return getMonthOrFavoriteEvents(events, currentDate, showFavorites, eventLikes);
    }
  }, [events, currentDate, showFavorites, eventLikes, showNewEvents, newEventIds]);
  
  // Filter events for the selected date and category filter
  const filteredEvents = selectedDate 
    ? getEventsForDay(events, selectedDate, filter)
    : [];
    
  // Get user's favorite events (events with likes)
  const favoriteEvents = events.filter(event => 
    (event.likes && event.likes > 0)
  );

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
  
  // Handler for adding a new event
  const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      // Add the event to local state directly
      const tempId = `temp-${Math.random().toString(36).substring(2, 9)}`;
      const eventWithId = {
        ...newEvent,
        id: tempId,
        likes: 0
      };
      
      // Refresh events after adding a new one
      refreshEvents();
      
      // Hide form after successful submission
      setShowEventForm(false);
    } catch (error) {
      console.error('Error adding event:', error);
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

  // When a filter is applied, reset date selection
  useEffect(() => {
    if (filter !== null) {
      setSelectedDate(null);
    }
  }, [filter]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
      <div className="flex flex-col space-y-6">
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
        />
        
        {/* Add Event button */}
        <div className="flex justify-center items-center">
          <Button 
            className="flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all"
            onClick={() => setShowEventForm(!showEventForm)}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden md:inline">Event {showEventForm ? "schließen" : "erstellen"}</span>
          </Button>
        </div>

        {/* Event form between menu and calendar */}
        {showEventForm && (
          <div className="w-full mt-4 mb-4 dark-glass-card rounded-2xl p-6 animate-fade-down animate-duration-300">
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
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-3/5 dark-glass-card rounded-2xl p-6">
                {showFavorites ? (
                  <FavoritesView 
                    favoriteEvents={favoriteEvents}
                    onSwitchToList={() => setView("list")}
                  />
                ) : showNewEvents ? (
                  <div className="text-center p-4">
                    <h3 className="text-lg font-medium mb-2">Neue Events</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Es gibt {newEventIds.size} neue Events seit deinem letzten Besuch.
                    </p>
                    <Button onClick={() => setView("list")}>
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
              <div className="w-full md:w-2/5 mt-6 md:mt-0">
                <EventPanel 
                  selectedDate={selectedDate}
                  selectedEvent={selectedEvent}
                  filteredEvents={filteredEvents}
                  filter={filter}
                  onEventSelect={handleEventSelect}
                  onEventClose={() => setSelectedEvent(null)}
                  onLike={handleLikeEvent}
                  onShowEventForm={() => setShowEventForm(true)}
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
