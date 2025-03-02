import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, isToday, parse, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Music, PartyPopper, Image, Dumbbell, Map, CalendarIcon, List, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EventDetails from './EventDetails';
import EventCard from './EventCard';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  
  // Separate state for event likes that persists across refreshes
  const [eventLikes, setEventLikes] = useState<Record<string, number>>(() => {
    const savedLikes = localStorage.getItem('eventLikes');
    return savedLikes ? JSON.parse(savedLikes) : {};
  });
  
  // Save likes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eventLikes', JSON.stringify(eventLikes));
  }, [eventLikes]);

  // Lade Events aus Supabase und externe Events beim Start
  useEffect(() => {
    fetchSupabaseEvents();
    fetchExternalEvents(true);
    setIsInitialLoad(false);
  }, []);

  // Funktion zum Laden der Events aus Supabase
  const fetchSupabaseEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('Loaded events from Supabase:', data);
        // Konvertiere Supabase UUIDs zu Strings und kombiniere mit existierenden Events
        const supabaseEvents = data.map(event => ({
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
      }
    } catch (error) {
      console.error('Error loading events from Supabase:', error);
      toast({
        title: "Fehler beim Laden der Events",
        description: "Die Events konnten nicht aus der Datenbank geladen werden.",
        variant: "destructive"
      });
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
      
      if (!isInitialLoad) {
        toast({
          title: "Fehler beim Laden der Events",
          description: "Es werden lokale Beispieldaten angezeigt.",
          variant: "destructive"
        });
      }
    }
    
    setIsLoading(false);
  };
  
  // Verarbeite die GitHub-Events
  const processGitHubEvents = (githubEvents: GitHubEvent[], isInitialLoad = false) => {
    try {
      // Aktuelles Jahr für die Datumskonvertierung
      const currentYear = new Date().getFullYear();
      
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
          likes: eventLikes[eventId] || 0, // Use stored likes if available
          link: githubEvent.link
        } as Event;
      });
      
      console.log(`Transformed ${transformedEvents.length} events successfully`);
      
      // Merge with user-created events (non-GitHub events)
      setEvents(prevEvents => {
        // Filter out GitHub events and keep user-created events
        const userEvents = prevEvents.filter(event => !event.id.startsWith('github-'));
        // Apply likes from storage to user events
        const updatedUserEvents = userEvents.map(event => ({
          ...event,
          likes: eventLikes[event.id] !== undefined ? eventLikes[event.id] : (event.likes || 0)
        }));
        return [...updatedUserEvents, ...transformedEvents];
      });
      
      // Only show toast when not initial load
      if (!isInitialLoad) {
        toast({
          title: "Events aktualisiert",
          description: `${transformedEvents.length} Events wurden geladen.`,
        });
      }
    } catch (error) {
      console.error("Fehler bei der Verarbeitung der GitHub-Events:", error);
      setEvents(prevEvents => {
        // Keep only events that are not from the example data
        const userEvents = prevEvents.filter(event => !bielefeldEvents.some(bEvent => bEvent.id === event.id));
        // Apply likes from storage
        const updatedUserEvents = userEvents.map(event => ({
          ...event,
          likes: eventLikes[event.id] !== undefined ? eventLikes[event.id] : (event.likes || 0)
        }));
        return [...updatedUserEvents, ...bielefeldEvents];
      });
      
      if (!isInitialLoad) {
        toast({
          title: "Fehler beim Laden der Events",
          description: "Es werden lokale Beispieldaten angezeigt.",
          variant: "destructive"
        });
      }
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
    // Update the likes in our separate state
    setEventLikes(prev => {
      const currentLikes = prev[eventId] || 0;
      return {
        ...prev,
        [eventId]: currentLikes + 1
      };
    });
    
    // Also update the likes in the events array for immediate UI update
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, likes: (event.likes || 0) + 1 } 
          : event
      )
    );
    
    // If this is a Supabase event (not a github-* event), update the likes in Supabase
    if (!eventId.startsWith('github-')) {
      try {
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
      } catch (error) {
        console.error('Error updating likes:', error);
      }
    }
  };

  // Calendar navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Filter events for the selected date and category filter
  const filteredEvents = selectedDate 
    ? events.filter(event => {
        const sameDay = isSameDay(parseISO(event.date), selectedDate);
        return filter ? (sameDay && event.category === filter) : sameDay;
      })
    : [];
  
  // Get all events for the current month and sort by likes
  const currentMonthEvents = events
    .filter(event => {
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
    setSelectedDate(day);
    setSelectedEvent(null);
  };
  
  // Handler for adding a new event
  const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      // Speichere das Event in Supabase
      const { data, error } = await supabase
        .from('community_events')
        .insert([newEvent])
        .select();
        
      if (error) {
        console.error('Error saving event to Supabase:', error);
        throw error;
      }
      
      if (data && data[0]) {
        // Event erfolgreich gespeichert, füge es zur lokalen Liste hinzu
        const eventWithId = {
          ...data[0],
          id: data[0].id.toString(),
          likes: 0
        };
        
        setEvents(prevEvents => [...prevEvents, eventWithId]);
        
        toast({
          title: "Event erstellt",
          description: `"${newEvent.title}" wurde erfolgreich zum Kalender hinzugefügt.`,
        });
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Fehler beim Erstellen des Events",
        description: "Das Event konnte nicht gespeichert werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
      
      // Fallback: Lokales Event hinzufügen, falls Supabase-Speicherung fehlschlägt
      const eventWithId = {
        ...newEvent,
        id: Math.random().toString(36).substring(2, 9),
        likes: 0,
      };
      
      setEvents([...events, eventWithId as Event]);
    }
  };

  // Check if a day has events
  const hasEvents = (day: Date) => {
    return events.some(event => isSameDay(parseISO(event.date), day));
  };

  // Get event count for a specific day
  const getEventCount = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), day)).length;
  };

  // Toggle category filter
  const toggleFilter = (category: string) => {
    setFilter(current => current === category ? null : category);
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
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </h2>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextMonth} 
              className="rounded-full hover:scale-105 transition-transform bg-red-500 text-black border-red-600"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
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
        <div className="flex justify-center items-center">
          <Tabs defaultValue={view} onValueChange={(value) => setView(value as "calendar" | "list")} className="flex flex-col items-center">
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
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all">
                    <Plus className="h-5 w-5" />
                    <span className="hidden md:inline">Event erstellen</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="dark-glass-effect max-w-md sm:max-w-lg">
                  <EventForm 
                    selectedDate={selectedDate ? selectedDate : new Date()} 
                    onAddEvent={handleAddEvent} 
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Main calendar and list views */}
            <TabsContent value="list" className="w-full">
              <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-white">
                    Alle Events im {format(currentDate, 'MMMM', { locale: de })}
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
                      Keine Events in diesem Monat {filter ? `in der Kategorie "${filter}"` : ''}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="w-full">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-3/5 dark-glass-card rounded-2xl p-6">
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
                </div>
                
                {/* Event list for selected date */}
                <div className="w-full md:w-2/5 dark-glass-card rounded-2xl p-6 overflow-hidden flex flex-col">
                  <h3 className="text-xl font-medium mb-4 text-white">
                    {selectedDate ? (
                      format(selectedDate, 'EEEE, d. MMMM', { locale: de })
                    ) : (
                      "Wähle ein Datum aus"
                    )}
                  </h3>
                  
                  <div className="flex-grow overflow-auto scrollbar-thin">
                    {selectedDate ? (
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
    description: 'Lerne, wie du auch mit wenig Platz in der Stadt Gemüse und Kräuter anbauen kannst.',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    time: '15:00',
    location: 'Stadtteilzentrum Liebefeld, Hauptstraße 55',
    organizer: 'Grünes Bielefeld e.V.',
    category: 'Workshop',
    likes: 2
  },
  {
    id: '6',
    title: 'Theater: Romeo und Julia',
    description: 'Moderne Inszenierung des Shakespeare-Klassikers vom Stadttheater Bielefeld.',
    date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    time: '19:30',
    location: 'Stadttheater Bielefeld, Brunnenstraße 3-9',
    organizer: 'Stadttheater Bielefeld',
    category: 'Kultur',
    likes: 6
  }
];

export default EventCalendar;
