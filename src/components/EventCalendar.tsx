import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, isToday, parse, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Music, PartyPopper, Image, Dumbbell, Map, CalendarIcon, List, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EventDetails from './EventDetails';
import EventCard from './EventCard';
import EventForm from './EventForm';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

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
  link?: string;
}

// URL zur JSON-Datei mit Events
const EXTERNAL_EVENTS_URL = "https://raw.githubusercontent.com/MaikZ91/productiontools/master/events.json";

interface GitHubEvent {
  date: string; // Format: "Fri, 04.04"
  event: string;
  link: string;
}

interface EventCalendarProps {
  defaultView?: "calendar" | "list";
}

const EventCalendar = ({ defaultView = "calendar" }: EventCalendarProps) => {
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">(defaultView);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Use this state only for initial loading to avoid flickering
  const [eventLikes, setEventLikes] = useState<Record<string, number>>(() => {
    const savedLikes = localStorage.getItem('eventLikes');
    return savedLikes ? JSON.parse(savedLikes) : {};
  });
  
  // Lade Events aus Supabase und externe Events beim Start
  useEffect(() => {
    fetchSupabaseEvents();
    fetchExternalEvents(true);
    setIsInitialLoad(false);
    
    // Check if today should be pre-selected
    const today = new Date();
    setSelectedDate(today);
  }, []);

  // Funktion zum Laden der Events aus Supabase
  const fetchSupabaseEvents = async () => {
    setIsLoading(true);
    try {
      // Fetch all events including GitHub-sourced events
      const { data: eventsData, error: eventsError } = await supabase
        .from('community_events')
        .select('*');
      
      if (eventsError) {
        throw eventsError;
      }
      
      // Fetch GitHub event likes from separate table
      const { data: githubLikesData, error: githubLikesError } = await supabase
        .from('github_event_likes')
        .select('*');
      
      if (githubLikesError) {
        console.error('Error loading GitHub likes:', githubLikesError);
      }
      
      // Create a map of GitHub event likes
      const githubLikesMap: Record<string, number> = {};
      if (githubLikesData) {
        githubLikesData.forEach(like => {
          githubLikesMap[like.event_id] = like.likes;
        });
      }
      
      if (eventsData) {
        console.log('Loaded events from Supabase:', eventsData);
        // Konvertiere Supabase UUIDs zu Strings und kombiniere mit existierenden Events
        const supabaseEvents = eventsData.map(event => ({
          ...event,
          id: event.id.toString()
        }));
        
        setEvents(prevEvents => {
          // Entferne Duplikate (Events mit gleicher ID)
          const filteredEvents = prevEvents.filter(
            event => !supabaseEvents.some(supaEvent => supaEvent.id === event.id)
          );
          return [...filteredEvents, ...supabaseEvents];
        });
        
        // Update local storage with GitHub likes for a smooth experience
        if (githubLikesData && githubLikesData.length > 0) {
          setEventLikes(prev => ({
            ...prev,
            ...githubLikesMap
          }));
          
          // Also update localStorage for immediate use
          localStorage.setItem('eventLikes', JSON.stringify({
            ...eventLikes,
            ...githubLikesMap
          }));
        }
      }
    } catch (error) {
      console.error('Error loading events from Supabase:', error);
      // Removed toast notification
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion zum Laden externer Events
  const fetchExternalEvents = async (isInitialLoad = false) => {
    setIsLoading(true);
    
    try {
      console.log(`Attempting to fetch events from: ${EXTERNAL_EVENTS_URL}`);
      const response = await fetch(EXTERNAL_EVENTS_URL);
      
      if (!response.ok) {
        console.log(`Fehler beim Laden von ${EXTERNAL_EVENTS_URL}: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const githubEvents: GitHubEvent[] = await response.json();
      console.log(`Successfully loaded ${githubEvents.length} events from ${EXTERNAL_EVENTS_URL}`);
      
      // Transformiere die GitHub-Events in das interne Format
      processGitHubEvents(githubEvents, isInitialLoad);
      
    } catch (error) {
      console.error(`Fehler beim Laden von ${EXTERNAL_EVENTS_URL}:`, error);
      // Verwende Beispieldaten
      console.log("Verwende lokale Beispieldaten, da keine externe Quelle verfügbar ist.");
      setEvents(prevEvents => {
        // Keep only events that are not from the example data
        const userEvents = prevEvents.filter(event => !bielefeldEvents.some(bEvent => bEvent.id === event.id));
        return [...userEvents, ...bielefeldEvents];
      });
      
      // Removed toast notification
    }
    
    setIsLoading(false);
  };
  
  // Verarbeite die GitHub-Events
  const processGitHubEvents = async (githubEvents: GitHubEvent[], isInitialLoad = false) => {
    try {
      // Aktuelles Jahr für die Datumskonvertierung
      const currentYear = new Date().getFullYear();
      
      // Fetch GitHub event likes from database
      const { data: githubLikesData, error: githubLikesError } = await supabase
        .from('github_event_likes')
        .select('*');
      
      if (githubLikesError) {
        console.error('Error loading GitHub likes:', githubLikesError);
      }
      
      // Create a map of GitHub event likes
      const githubLikesMap: Record<string, number> = {};
      if (githubLikesData) {
        githubLikesData.forEach(like => {
          githubLikesMap[like.event_id] = like.likes;
        });
      }
      
      // Transformiere GitHub-Events in das interne Format
      const transformedEvents = githubEvents.map((githubEvent, index) => {
        // Extrahiere Veranstaltungsort aus dem Event-Titel (falls vorhanden)
        let title = githubEvent.event;
        let location = "Bielefeld";
        let category = determineEventCategory(githubEvent.event.toLowerCase());
        
        // Überprüfe, ob es eine Standortangabe in Klammern gibt
        const locationMatch = githubEvent.event.match(/\(@([^)]+)\)/);
        if (locationMatch) {
          // Entferne die Standortangabe aus dem Titel
          title = githubEvent.event.replace(/\s*\(@[^)]+\)/, '');
          location = locationMatch[1];
        }
        
        // Parse das Datum (Format: "Fri, 04.04")
        let eventDate;
        try {
          // Extract the day of week and date part
          const dateParts = githubEvent.date.split(', ');
          const dayOfWeek = dateParts[0]; // e.g., "Fri"
          const dateNumbers = dateParts[1].split('.'); // e.g., ["04", "04"]
          
          // Parse day and month numbers
          const day = parseInt(dateNumbers[0], 10);
          const month = parseInt(dateNumbers[1], 10) - 1; // JavaScript months are 0-indexed
          
          // Create date with current year - FIXED: Use UTC to avoid timezone issues
          eventDate = new Date(Date.UTC(currentYear, month, day));
          
          // If the date is in the past, add a year (for events happening next year)
          if (eventDate < new Date() && month < 6) { // Only for first half of the year
            eventDate.setFullYear(currentYear + 1);
          }
        } catch (err) {
          console.warn(`Konnte Datum nicht parsen: ${githubEvent.date}`, err);
          // Fallback to today's date
          eventDate = new Date();
        }
        
        const eventId = `github-${index}`;
        
        // Get likes from database or fallback to stored values
        const likesCount = githubLikesMap[eventId] !== undefined ? githubLikesMap[eventId] : (eventLikes[eventId] || 0);
        
        // Erstelle das Event-Objekt und FIXED: Format the date correctly
        return {
          id: eventId,
          title: title,
          description: `Mehr Informationen unter: ${githubEvent.link}`,
          date: format(eventDate, 'yyyy-MM-dd'), // Properly format as YYYY-MM-DD
          time: "19:00", // Default-Zeit für Events ohne Zeitangabe
          location: location,
          organizer: "Liebefeld Community Bielefeld",
          category: category,
          likes: likesCount,
          link: githubEvent.link
        } as Event;
      });
      
      console.log(`Transformed ${transformedEvents.length} events successfully`);
      
      // Update local map with database values
      const newLikesMap: Record<string, number> = {...eventLikes};
      transformedEvents.forEach(event => {
        if (githubLikesMap[event.id] !== undefined) {
          newLikesMap[event.id] = githubLikesMap[event.id];
        }
      });
      
      setEventLikes(newLikesMap);
      localStorage.setItem('eventLikes', JSON.stringify(newLikesMap));
      
      // Merge with user-created events (non-GitHub events)
      setEvents(prevEvents => {
        // Filter out GitHub events and keep user-created events
        const userEvents = prevEvents.filter(event => !event.id.startsWith('github-'));
        return [...userEvents, ...transformedEvents];
      });
      
      // Removed toast notification
    } catch (error) {
      console.error("Fehler bei der Verarbeitung der GitHub-Events:", error);
      setEvents(prevEvents => {
        // Keep only events that are not from the example data
        const userEvents = prevEvents.filter(event => !bielefeldEvents.some(bEvent => bEvent.id === event.id));
        return [...userEvents, ...bielefeldEvents];
      });
      
      // Removed toast notification
    }
  };

  // Bestimme Kategorie basierend auf Schlüsselwörtern im Titel
  const determineEventCategory = (title: string): string => {
    if (title.includes("konzert") || title.includes("festival") || title.includes("musik") || 
        title.includes("band") || title.includes("jazz") || title.includes("chor")) {
      return "Konzert";
    } else if (title.includes("party") || title.includes("feier") || title.includes("disco") || 
               title.includes("club") || title.includes("tanz")) {
      return "Party";
    } else if (title.includes("ausstellung") || title.includes("galerie") || title.includes("kunst") || 
               title.includes("museum") || title.includes("vernissage")) {
      return "Ausstellung";
    } else if (title.includes("sport") || title.includes("fußball") || title.includes("lauf") || 
               title.includes("turnier") || title.includes("fitness")) {
      return "Sport";
    } else if (title.includes("workshop") || title.includes("kurs")) {
      return "Workshop";
    } else if (title.includes("theater") || title.includes("film") || title.includes("kino")) {
      return "Kultur";
    } else {
      return "Sonstiges";
    }
  };

  // Handle like functionality
  const handleLikeEvent = async (eventId: string) => {
    try {
      // Update the likes in our separate state for immediate UI update
      setEventLikes(prev => {
        const currentLikes = prev[eventId] || 0;
        const updatedLikes = {
          ...prev,
          [eventId]: currentLikes + 1
        };
        
        // Update localStorage too
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      // Also update the likes in the events array for immediate UI update
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes: (event.likes || 0) + 1 } 
            : event
        )
      );
      
      // If this is a GitHub event, update likes in github_event_likes table
      if (eventId.startsWith('github-')) {
        const currentLikesValue = eventLikes[eventId] || 0;
        const newLikesValue = currentLikesValue + 1;
        
        // Check if the record already exists
        const { data: existingLike, error: checkError } = await supabase
          .from('github_event_likes')
          .select('*')
          .eq('event_id', eventId)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error('Error checking if GitHub like exists:', checkError);
        }
        
        if (existingLike) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('github_event_likes')
            .update({ likes: newLikesValue })
            .eq('event_id', eventId);
            
          if (updateError) {
            console.error('Error updating GitHub event likes:', updateError);
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('github_event_likes')
            .insert({ event_id: eventId, likes: newLikesValue });
            
          if (insertError) {
            console.error('Error inserting GitHub event likes:', insertError);
          }
        }
      } 
      // If this is a Supabase event (not a github-* event), update the likes in Supabase
      else if (!eventId.startsWith('github-')) {
        // Find the current event to get the updated likes count
        const currentEvent = events.find(event => event.id === eventId);
        if (currentEvent) {
          const updatedLikes = (currentEvent.likes || 0) + 1;
          
          const { error } = await supabase
            .from('community_events')
            .update({ likes: updatedLikes })
            .eq('id', eventId);
            
          if (error) {
            console.error('Error updating likes in Supabase:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  // Calendar navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Debug log to check current date and selected date
  console.log('Current date:', currentDate);
  console.log('Selected date:', selectedDate);
  console.log('Today date:', new Date());
  
  // Filter events for the selected date and category filter
  const filteredEvents = selectedDate 
    ? events.filter(event => {
        // Debug: check if we have events for today
        if (isToday(selectedDate)) {
          console.log('Checking today\'s events:', event.date, parseISO(event.date));
        }
        
        const eventDate = parseISO(event.date);
        const sameDay = isSameDay(eventDate, selectedDate);
        
        return filter ? (sameDay && event.category === filter) : sameDay;
      })
    : [];
  
  // Debug log to see filtered events
  console.log('Filtered events for selected date:', filteredEvents);

  // Get user's favorite events (events with likes)
  const favoriteEvents = events.filter(event => {
    // For GitHub events
    if (event.id.startsWith('github-')) {
      return eventLikes[event.id] && eventLikes[event.id] > 0;
    }
    // For regular events
    return event.likes && event.likes > 0;
  });
  
  // Get all events for the current month and sort by likes
  const currentMonthEvents = events
    .filter(event => {
      // If viewing favorites, only show favorites regardless of month
      if (showFavorites) {
        // For GitHub events
        if (event.id.startsWith('github-')) {
          return eventLikes[event.id] && eventLikes[event.id] > 0;
        }
        // For regular events
        return event.likes && event.likes > 0;
      }
      
      // Otherwise filter by current month
      const eventDate = parseISO(event.date);
      return isSameMonth(eventDate, currentDate);
    })
    .sort((a, b) => {
      // First sort by likes (descending)
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      
      if (likesA !== likesB) {
        return likesB - likesA;
      }
      
      // Then by date (ascending)
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  
  // Group events by date for the list view
  const eventsByDate = currentMonthEvents.reduce((acc, event) => {
    const dateStr = event.date;
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, Event[]>);
  
  // Handler for selecting a date
  const handleDateClick = (day: Date) => {
    console.log('Date clicked:', day);
    setSelectedDate(day);
    setSelectedEvent(null);
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
      
      setEvents(prevEvents => [...prevEvents, eventWithId]);
      
      // Removed toast notification
      
      // Formular nach erfolgreichem Hinzufügen ausblenden
      setShowEventForm(false);
    } catch (error) {
      console.error('Error adding event:', error);
      // Removed toast notification
    }
  };

  // Check if a day has events
  const hasEvents = (day: Date) => {
    return events.some(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, day);
    });
  };

  // Get event count for a specific day
  const getEventCount = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, day);
    }).length;
  };

  // Toggle category filter
  const toggleFilter = (category: string) => {
    setFilter(current => current === category ? null : category);
  };

  // Toggle favorites view
  const toggleFavorites = () => {
    setShowFavorites(prev => !prev);
    
    // Reset date selection when toggling favorites
    if (!showFavorites) {
      setSelectedDate(null);
      // Removed toast notification
    } else {
      // Removed toast notification
    }
    
    // Important: We don't change the view state here anymore
    // This allows users to stay in their current view (list or calendar)
  };

  // Get all unique categories from events
  const categories = Array.from(new Set(events.map(event => event.category)));

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
      <div className="flex flex-col space-y-6">
        {/* Calendar header with month navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between md:justify-start">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={prevMonth} 
              className="rounded-full hover:scale-105 transition-transform bg-red-500 text-black border-red-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl md:text-2xl font-medium w-48 text-center text-black">
              {showFavorites ? "Meine Favoriten" : format(currentDate, 'MMMM yyyy', { locale: de })}
            </h2>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextMonth} 
              className="rounded-full hover:scale-105 transition-transform bg-red-500 text-black border-red-600"
              disabled={showFavorites}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {/* Favorites button positioned at the beginning of the filter list */}
              <Button 
                className={cn(
                  "flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all",
                  showFavorites ? "bg-red-500 text-white hover:bg-red-600" : "bg-black text-red-500 border-red-500 hover:bg-black/90 hover:text-red-500"
                )}
                onClick={toggleFavorites}
              >
                <Heart className={cn("h-4 w-4", showFavorites ? "fill-white" : "")} />
                <span className="hidden sm:inline">
                  {showFavorites ? "Alle" : "Favoriten"}
                </span>
                {!showFavorites && favoriteEvents.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {favoriteEvents.length}
                  </span>
                )}
              </Button>
              
              {categories.map(category => (
                <Button
                  key={category}
                  variant={filter === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(category)}
                  className={cn(
                    "rounded-full whitespace-nowrap",
                    (category === "Konzert" || category === "Party" || category === "Sonstiges") ?
                      (filter === category 
                        ? "bg-black text-red-500 border-red-500 hover:bg-black/90 hover:text-red-500" 
                        : "bg-black text-red-500 border-red-500 hover:bg-black/90 hover:text-red-500")
                      : (filter === category 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-black/70 text-white border-gray-700 hover:bg-black/60 hover:text-white dark-button")
                  )}
                >
                  {category in categoryIcons ? categoryIcons[category as keyof typeof categoryIcons] : null}
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* View toggle with Add Event button moved beside it */}
        <div className="flex justify-center items-center flex-col">
          <Tabs 
            defaultValue={view} 
            value={view} // Explicitly set the current value
            onValueChange={(value) => setView(value as "calendar" | "list")} 
            className="flex flex-col items-center w-full"
          >
            <div className="flex items-center gap-3">
              <TabsList className="dark-tabs">
                <TabsTrigger value="list" className={view === "list" ? "text-white" : "text-gray-400"}>
                  <List className="w-4 h-4 mr-2" />
                  Liste
                </TabsTrigger>
                <TabsTrigger value="calendar" className={view === "calendar" ? "text-white" : "text-gray-400"}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Kalender
                </TabsTrigger>
              </TabsList>
              
              <Button 
                className="flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all"
                onClick={() => setShowEventForm(!showEventForm)}
              >
                <Plus className="h-5 w-5" />
                <span className="hidden md:inline">Event {showEventForm ? "schließen" : "erstellen"}</span>
              </Button>
            </div>

            {/* Neues Event-Formular zwischen Menü und Kalender */}
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
            <TabsContent value="list" className="w-full">
              <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-white">
                    {showFavorites 
                      ? "Meine Favoriten" 
                      : `Alle Events im ${format(currentDate, 'MMMM', { locale: de })}`}
                  </h3>
                </div>
                
                <div className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
                  {Object.keys(eventsByDate).length > 0 ? (
                    Object.keys(eventsByDate).sort().map(dateStr => {
                      const date = parseISO(dateStr);
                      return (
                        <div key={dateStr} className="mb-4">
                          <h4 className="text-sm font-medium mb-2 text-white sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-2 z-10 rounded-md">
                            {format(date, 'EEEE, d. MMMM', { locale: de })}
                          </h4>
                          <div className="space-y-1">
                            {eventsByDate[dateStr].map(event => (
                              <EventCard 
                                key={event.id} 
                                event={event}
                                compact={true}
                                onClick={() => {
                                  setSelectedDate(date);
                                  setSelectedEvent(event);
                                }}
                                onLike={handleLikeEvent}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      {showFavorites 
                        ? "Du hast noch keine Favoriten" 
                        : `Keine Events in diesem Monat ${filter ? `in der Kategorie "${filter}"` : ''}`}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="w-full">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-3/5 dark-glass-card rounded-2xl p-6">
                  {showFavorites ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                      <Heart className="w-12 h-12 mb-4 text-red-500" />
                      <h3 className="text-xl font-medium text-white mb-2">Deine Favoriten</h3>
                      <p className="text-center mb-4">
                        {favoriteEvents.length 
                          ? `Du hast ${favoriteEvents.length} Favoriten` 
                          : "Du hast noch keine Favoriten"}
                      </p>
                      {favoriteEvents.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setView("list")}
                          className="text-white border-white hover:bg-white/10"
                        >
                          <List className="w-4 h-4 mr-2" />
                          Als Liste anzeigen
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Day names header */}
                      <div className="grid grid-cols-7 mb-4">
                        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
                          <div key={day} className="text-center font-medium text-gray-400">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar days */}
                      <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map((day, i) => {
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          const dayHasEvents = hasEvents(day);
                          const isCurrentDay = isToday(day);
                          const eventCount = getEventCount(day);
                          
                          return (
                            <button
                              key={i}
                              onClick={() => handleDateClick(day)}
                              className={cn(
                                "calendar-day hover-scale relative flex flex-col items-center justify-center",
                                isSelected ? "bg-primary text-primary-foreground" : "",
                                !isCurrentMonth ? "text-gray-600" : "text-gray-200",
                                isCurrentDay ? "ring-2 ring-primary ring-offset-2 ring-offset-[#131722]" : ""
                              )}
                            >
                              {format(day, 'd')}
                              {dayHasEvents && (
                                <div className="absolute bottom-1 flex space-x-0.5">
                                  {eventCount > 3 ? (
                                    <span className="text-[10px] font-semibold text-primary">{eventCount}</span>
                                  ) : (
                                    Array(eventCount).fill(0).map((_, i) => (
                                      <div 
                                        key={i} 
                                        className="w-1 h-1 rounded-full bg-primary"
                                      />
                                    ))
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Event list for selected date */}
                <div className="w-full md:w-2/5 dark-glass-card rounded-2xl p-6 overflow-hidden flex flex-col">
                  <h3 className="text-xl font-medium mb-4 text-white">
                    {showFavorites 
                      ? "Meine Favoriten" 
                      : (selectedDate 
                          ? format(selectedDate, 'EEEE, d. MMMM', { locale: de })
                          : "Wähle ein Datum aus"
                        )
                    }
                  </h3>
                  
                  <div className="flex-grow overflow-auto scrollbar-thin">
                    {showFavorites ? (
                      favoriteEvents.length > 0 ? (
                        <div className="space-y-4">
                          {favoriteEvents.map(event => (
                            <EventCard 
                              key={event.id} 
                              event={event}
                              onClick={() => setSelectedEvent(event)}
                              onLike={handleLikeEvent}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          Du hast noch keine Favoriten
                        </div>
                      )
                    ) : (
                      selectedDate ? (
                        filteredEvents.length > 0 ? (
                          <div className="space-y-4">
                            {filteredEvents.map(event => (
                              <EventCard 
                                key={event.id} 
                                event={event}
                                onClick={() => setSelectedEvent(event)}
                                onLike={handleLikeEvent}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            Keine Events an diesem Tag {filter ? `in der Kategorie "${filter}"` : ''}
                          </div>
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          Wähle ein Datum, um Events anzuzeigen
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Event details modal */}
        {selectedEvent && (
          <EventDetails 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
      </div>
    </div>
  );
};

// Sample data for initial display
const bielefeldEvents: Event[] = [
  {
    id: '1',
    title: 'Indie Rock Konzert: Liebefeld Band',
    description: 'Live-Musik mit lokalen Bands aus Bielefeld. Ein Abend voller Indie-Rock und guter Stimmung.',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    location: 'Forum Bielefeld, Niederwall 23',
    organizer: 'Bielefeld Musik e.V.',
    category: 'Konzert',
    likes: 5
  },
  {
    id: '2',
    title: 'Kunstausstellung: Stadt im Wandel',
    description: 'Fotografien und Gemälde zum Wandel von Bielefeld in den letzten Jahrzehnten.',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    location: 'Kunsthalle Bielefeld, Artur-Ladebeck-Straße 5',
    organizer: 'Kunstverein Bielefeld',
    category: 'Ausstellung',
    likes: 3
  },
  {
    id: '3',
    title: 'Stadtlauf Bielefeld',
    description: 'Jährlicher Stadtlauf durch die Innenstadt. Für Läufer aller Altersklassen.',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    time: '10:00',
    location: 'Start: Jahnplatz',
    organizer: 'Sportbund Bielefeld',
    category: 'Sport',
    likes: 8
  },
  {
    id: '4',
    title: 'Weekend Party im Club Freitag',
    description: 'Die beste Party am Wochenende mit DJ Max und Special Guests.',
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
    time: '23:00',
    location: 'Club Freitag, Niederstraße 9',
    organizer: 'Club Freitag',
    category: 'Party',
    likes: 12
  },
  {
    id: '5',
    title: 'Workshop: Urban Gardening',
    description: 'Lerne, wie du auch mit wenig Platz Gemüse und Kräuter anbauen kannst.',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    time: '16:00',
    location: 'Umweltzentrum, August-Bebel-Straße 16',
    organizer: 'Grüne Stadt Bielefeld',
    category: 'Workshop',
    likes: 4
  }
];

export default EventCalendar;
