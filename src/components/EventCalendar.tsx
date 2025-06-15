import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { Music, PartyPopper, Image, Dumbbell, Map, Plus, Users } from 'lucide-react';
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

const categoryIcons = {
  "Konzert": <Music className="h-4 w-4" />,
  "Party": <PartyPopper className="h-4 w-4" />,
  "Ausstellung": <Image className="h-4 w-4" />,
  "Sport": <Dumbbell className="h-4 w-4" />,
  "Workshop": <Plus className="h-4 w-4" />,
  "Kultur": <Image className="h-4 w-4" />,
  "Sonstiges": <Map className="h-4 w-4" />,
  "Networking": <Users className="h-4 w-4" />,
  "Meeting": <Users className="h-4 w-4" />
};

const cities = [
  { name: "Bielefeld", abbr: "BI" },
  { name: "Berlin", abbr: "berlin" },
  { name: "Hamburg", abbr: "hamburg" },
  { name: "München", abbr: "munich" },
  { name: "Köln", abbr: "cologne" },
  { name: "Frankfurt", abbr: "frankfurt" },
  { name: "Stuttgart", abbr: "stuttgart" },
  { name: "Düsseldorf", abbr: "duesseldorf" },
  { name: "Leipzig", abbr: "leipzig" },
  { name: "Hannover", abbr: "hanover" },
  { name: "Nürnberg", abbr: "nuremberg" },
  { name: "Bremen", abbr: "bremen" },
  { name: "Dresden", abbr: "dresden" },
  { name: "Essen", abbr: "essen" },
  { name: "Dortmund", abbr: "dortmund" },
];

export const isTribeEvent = (title: string): boolean => {
  const tribeKeywords = ['tribe', 'tuesday run', 'kennenlernabend', 'creatives circle'];
  return tribeKeywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  );
};

const EventCalendar = ({ defaultView = "list" }: EventCalendarProps) => {
  const { 
    events, 
    selectedDate, 
    setSelectedDate, 
    selectedEvent, 
    setSelectedEvent,
    filter,
    setFilter,
    showFavorites,
    setShowFavorites,
    refreshEvents,
    topEventsPerDay,
    addUserEvent,
    selectedCity
  } = useEventContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">(defaultView);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showNewEvents, setShowNewEvents] = useState(false);
  
  const eventsFilteredByCity = React.useMemo(() => {
    if (!selectedCity) return events;
    const cityObject = cities.find(c => c.abbr === selectedCity);
    if (!cityObject) return events;
    const cityName = cityObject.name;
    return events.filter(event => event.location && event.location.toLowerCase() === cityName.toLowerCase());
  }, [events, selectedCity]);
  
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const eventsToDisplay = React.useMemo(() => {
    if (showNewEvents) {
      return []; // No new events tracking for now
    } else if (showFavorites) {
      return eventsFilteredByCity.filter(event => 
        event.date && 
        topEventsPerDay[event.date] === event.id && 
        (event.likes && event.likes > 0)
      );
    } else {
      return getMonthOrFavoriteEvents(eventsFilteredByCity, currentDate, false, {});
    }
  }, [eventsFilteredByCity, currentDate, showFavorites, showNewEvents, topEventsPerDay]);
  
  const filteredEvents = selectedDate 
    ? getEventsForDay(eventsFilteredByCity, selectedDate, filter)
    : [];
    
  const favoriteEvents = React.useMemo(() => {
    return eventsFilteredByCity.filter(event => 
      event.date && 
      topEventsPerDay[event.date] === event.id && 
      (event.likes && event.likes > 0)
    );
  }, [eventsFilteredByCity, topEventsPerDay]);

  const handleDateClick = (day: Date) => {
    const normalizedDay = normalizeDate(day);
    console.log(`Selecting date: ${normalizedDay.toISOString()}`);
    setSelectedDate(normalizedDay);
    setSelectedEvent(null);
  };
  
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleSelectEventFromList = useCallback((event: Event, date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(event);
  }, [setSelectedDate, setSelectedEvent]);

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

  const toggleFilter = (category: string) => {
    setFilter(current => current === category ? null : category);
  };

  const toggleFavorites = () => {
    if (showNewEvents) setShowNewEvents(false);
    setShowFavorites(prev => !prev);
    
    if (!showFavorites) {
      setSelectedDate(null);
    }
  };
  
  const toggleNewEvents = () => {
    if (showFavorites) setShowFavorites(false);
    setShowNewEvents(prev => !prev);
    
    if (!showNewEvents) {
      setSelectedDate(null);
    }
  };

  const toggleEventForm = () => {
    setShowEventForm(prev => !prev);
  };

  const triggerChatbotQuery = (query: string) => {
    if (typeof window !== 'undefined' && (window as any).chatbotQuery) {
      (window as any).chatbotQuery(query);
    }
  };

  useEffect(() => {
    if (filter !== null) {
      setSelectedDate(null);
    }
  }, [filter]);

  return (
    <div className="container mx-auto px-2 py-4 max-w-[1280px] animate-fade-in">
      <div className="flex flex-col space-y-2">
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
          newEventsCount={0} // No new events tracking for now
          view={view}
          setView={setView}
          onShowEventForm={toggleEventForm}
          showEventForm={showEventForm}
        />

        {showEventForm && (
          <div className="w-full mt-2 mb-2 dark-glass-card rounded-xl p-4 animate-fade-down animate-duration-300">
            <EventForm 
              selectedDate={selectedDate ? selectedDate : new Date()} 
              onAddEvent={handleAddEvent}
              onCancel={() => setShowEventForm(false)}
            />
          </div>
        )}
        
        <Tabs 
          defaultValue={view} 
          value={view} 
          className="flex flex-col items-center w-full"
        >
          <TabsContent value="list" className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <div className="md:col-span-3">
                <EventList 
                  events={eventsToDisplay}
                  showFavorites={showFavorites}
                  showNewEvents={showNewEvents}
                  onSelectEvent={handleSelectEventFromList}
                />
              </div>
            </div>
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
                      Keine neuen Events gefunden.
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
              
              <div className="w-full md:w-2/5 mt-3 md:mt-0 flex flex-col gap-3">
                <EventPanel 
                  selectedDate={selectedDate}
                  selectedEvent={selectedEvent}
                  filteredEvents={filteredEvents}
                  filter={filter}
                  onEventSelect={handleEventSelect}
                  onEventClose={() => setSelectedEvent(null)}
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
