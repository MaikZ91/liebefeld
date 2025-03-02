import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, isToday, parse, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Music, PartyPopper, Image, Dumbbell, Map, CalendarIcon, List, Heart, ScrollText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EventDetails from './EventDetails';
import EventCard from './EventCard';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EventForm from './EventForm';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadElementAsPng } from '../utils/imageUtils';

// Type definitions
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: string;
  likes?: number;
  url?: string;
}

// URL for events JSON file
const EXTERNAL_EVENTS_URL = "https://raw.githubusercontent.com/MaikZ91/productiontools/master/events.json";

// Updated URL for the global rankings API - use a local storage approach instead of the API that's failing
// We'll keep this as a constant for clarity but won't use it
const GLOBAL_RANKINGS_API = "";
const API_KEY = "";

// Local storage key for rankings
const LOCAL_STORAGE_RANKINGS_KEY = "liebefeld-event-rankings";

interface GitHubEvent {
  date: string; // Format: "Fri, 04.04"
  event: string;
  link: string;
}

interface EventCalendarProps {
  defaultView?: "calendar" | "list";
}

const EventCalendar: React.FC<EventCalendarProps> = ({ defaultView = "calendar" }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [view, setView] = useState<"calendar" | "list">(defaultView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState<Record<string, number>>({});
  const calendarRef = useRef<HTMLDivElement>(null);

  // Fetch events from the API
  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(EXTERNAL_EVENTS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      const data = await response.json();
      
      // Merge with local events
      const localEvents = getLocalEvents();
      const mergedEvents = [...data, ...localEvents];
      
      // Apply existing rankings to the events
      const eventsWithRankings = mergedEvents.map(event => ({
        ...event,
        likes: rankings[event.id] || 0
      }));
      
      setEvents(eventsWithRankings);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again later.");
      
      // Fallback to local events if external fetch fails
      const localEvents = getLocalEvents();
      const eventsWithRankings = localEvents.map(event => ({
        ...event,
        likes: rankings[event.id] || 0
      }));
      setEvents(eventsWithRankings);
    } finally {
      setLoading(false);
    }
  };

  // Load rankings from local storage
  const loadRankings = () => {
    try {
      const storedRankings = localStorage.getItem(LOCAL_STORAGE_RANKINGS_KEY);
      if (storedRankings) {
        const parsedRankings = JSON.parse(storedRankings);
        setRankings(parsedRankings);
        
        // Update events with rankings
        setEvents(prevEvents => 
          prevEvents.map(event => ({
            ...event,
            likes: parsedRankings[event.id] || 0
          }))
        );
      }
    } catch (error) {
      console.error("Error loading rankings from localStorage:", error);
      // Initialize with empty rankings if there's an error
      setRankings({});
    }
  };

  // Update event rankings
  const updateEventRanking = (eventId: string) => {
    const updatedRankings = { ...rankings };
    
    // Increment the likes for this event or initialize to 1 if it doesn't exist
    updatedRankings[eventId] = (updatedRankings[eventId] || 0) + 1;
    
    // Update state and localStorage
    setRankings(updatedRankings);
    try {
      localStorage.setItem(LOCAL_STORAGE_RANKINGS_KEY, JSON.stringify(updatedRankings));
      
      // Update the events array with the new likes count
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes: updatedRankings[eventId] } 
            : event
        )
      );
      
      toast({
        title: "Event Liked!",
        description: "Thank you for liking this event.",
      });
    } catch (error) {
      console.error("Error saving rankings to localStorage:", error);
      toast({
        title: "Error",
        description: "Could not save your like. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get local events from localStorage
  const getLocalEvents = (): Event[] => {
    try {
      const localEvents = localStorage.getItem('localEvents');
      return localEvents ? JSON.parse(localEvents) : [];
    } catch (error) {
      console.error("Error loading local events:", error);
      return [];
    }
  };

  // Save a new event to localStorage
  const saveEvent = (newEvent: Event) => {
    try {
      const localEvents = getLocalEvents();
      const updatedEvents = [...localEvents, newEvent];
      localStorage.setItem('localEvents', JSON.stringify(updatedEvents));
      
      // Update the events state with the new event
      setEvents(prevEvents => [...prevEvents, newEvent]);
      
      setShowEventForm(false);
      toast({
        title: "Event Created",
        description: "Your event has been successfully created.",
      });
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Could not save your event. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadRankings();
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleAddEvent = () => {
    setShowEventForm(true);
  };

  const handleRefresh = () => {
    fetchEvents();
  };

  const handleDownloadCalendar = () => {
    if (calendarRef.current) {
      downloadElementAsPng(calendarRef.current, 'liebefeld-calendar.png');
      toast({
        title: "Calendar Downloaded",
        description: "Your calendar has been downloaded as an image.",
      });
    }
  };

  // Sort events by likes
  const sortEventsByLikes = (events: Event[]) => {
    return [...events].sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      return likesB - likesA; // Sort by likes in descending order
    });
  };

  // Generate days for the current month's calendar
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      // Get events for this day
      let dayEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isSameDay(eventDate, day);
        } catch (error) {
          console.error(`Error parsing date for event ${event.id}:`, error);
          return false;
        }
      });

      // Sort events by likes
      dayEvents = sortEventsByLikes(dayEvents);

      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
      const isCurrentMonth = isSameMonth(day, currentDate);
      const isCurrentDay = isToday(day);

      return (
        <div
          key={day.toString()}
          className={cn(
            "h-24 border p-1 relative",
            !isCurrentMonth && "bg-gray-50 text-gray-400",
            isSelected && "bg-blue-50",
            isCurrentDay && "border-blue-500 border-2"
          )}
          onClick={() => handleDateClick(day)}
        >
          <div className="text-right mb-1">
            {format(day, "d")}
          </div>
          <div className="overflow-auto max-h-16">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={cn(
                  "text-xs mb-1 p-1 rounded truncate cursor-pointer",
                  event.category === "music" && "bg-purple-100",
                  event.category === "party" && "bg-pink-100",
                  event.category === "art" && "bg-yellow-100",
                  event.category === "sport" && "bg-green-100",
                  event.category === "other" && "bg-gray-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event);
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  // Generate the day names for the calendar header
  const renderDayNames = () => {
    const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    return weekDays.map((day, index) => (
      <div key={index} className="font-semibold text-center py-2">
        {day}
      </div>
    ));
  };

  // Get events for the selected date
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const filteredEvents = events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, selectedDate);
      } catch (error) {
        console.error(`Error parsing date for event ${event.id}:`, error);
        return false;
      }
    });
    
    // Sort events by likes
    return sortEventsByLikes(filteredEvents);
  };

  // Get the top rated events
  const getTopRatedEvents = (limit = 5) => {
    return sortEventsByLikes(
      events.filter(event => (event.likes || 0) > 0)
    ).slice(0, limit);
  };

  // Sort events by date
  const getSortedEvents = () => {
    // First sort by date
    const dateFirstSort = [...events].sort((a, b) => {
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        // If dates are equal, sort by likes
        if (dateA.getTime() === dateB.getTime()) {
          return (b.likes || 0) - (a.likes || 0);
        }
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error("Error sorting events by date:", error);
        return 0;
      }
    });
    
    return dateFirstSort;
  };

  // Render the calendar view
  const renderCalendarView = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold mx-4">
              {format(currentDate, "MMMM yyyy", { locale: de })}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownloadCalendar}>
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px" ref={calendarRef}>
          {renderDayNames()}
          {renderCalendarDays()}
        </div>
        
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">
              Events on {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: de })}
            </h3>
            <div className="space-y-2">
              {getEventsForSelectedDate().length > 0 ? (
                getEventsForSelectedDate().map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => handleEventClick(event)}
                    onLike={() => updateEventRanking(event.id)}
                    likes={event.likes || 0}
                  />
                ))
              ) : (
                <p>No events scheduled for this date.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render the list view
  const renderListView = () => {
    const sortedEvents = getSortedEvents();
    const topRatedEvents = getTopRatedEvents();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">All Events</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          {topRatedEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Top Rated Events</h3>
              <div className="space-y-2">
                {topRatedEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => handleEventClick(event)}
                    onLike={() => updateEventRanking(event.id)}
                    likes={event.likes || 0}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
            <div className="space-y-2">
              {sortedEvents.length > 0 ? (
                sortedEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => handleEventClick(event)}
                    onLike={() => updateEventRanking(event.id)}
                    likes={event.likes || 0}
                  />
                ))
              ) : (
                <p>No events available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "music": return <Music className="h-5 w-5" />;
      case "party": return <PartyPopper className="h-5 w-5" />;
      case "art": return <Image className="h-5 w-5" />;
      case "sport": return <Dumbbell className="h-5 w-5" />;
      default: return <Map className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue={view} onValueChange={(value) => setView(value as "calendar" | "list")}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Liebefeld Community Events</h1>
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>
        </div>
        
        {loading && <p>Loading events...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        <TabsContent value="calendar">
          {renderCalendarView()}
        </TabsContent>
        
        <TabsContent value="list">
          {renderListView()}
        </TabsContent>
      </Tabs>
      
      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-lg">
            <EventDetails 
              event={selectedEvent} 
              onClose={() => setSelectedEvent(null)}
              likes={selectedEvent.likes || 0}
              onLikeClick={() => updateEventRanking(selectedEvent.id)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Event Form Dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="sm:max-w-lg">
          <EventForm 
            selectedDate={selectedDate || new Date()}
            onAddEvent={saveEvent}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendar;
