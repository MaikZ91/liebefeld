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
  
  const [eventLikes, setEventLikes] = useState<Record<string, number>>(() => {
    const savedLikes = localStorage.getItem('eventLikes');
    return savedLikes ? JSON.parse(savedLikes) : {};
  });

  useEffect(() => {
    console.log("EventCalendar: Initial loading...");
    const fetchEvents = async () => {
      await fetchSupabaseEvents();
      await fetchExternalEvents(true);
    };
    
    fetchEvents();
    
    // Set today as the initial selected date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Setting initial selected date to today:', today);
    setSelectedDate(today);
    
    setIsInitialLoad(false);
  }, []);

  const fetchSupabaseEvents = async () => {
    setIsLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('community_events')
        .select('*');
      
      if (eventsError) {
        throw eventsError;
      }
      
      const { data: githubLikesData, error: githubLikesError } = await supabase
        .from('github_event_likes')
        .select('*');
      
      if (githubLikesError) {
        console.error('Error loading GitHub likes:', githubLikesError);
      }
      
      const githubLikesMap: Record<string, number> = {};
      if (githubLikesData) {
        githubLikesData.forEach(like => {
          githubLikesMap[like.event_id] = like.likes;
        });
      }
      
      if (eventsData) {
        console.log('Loaded events from Supabase:', eventsData);
        const supabaseEvents = eventsData.map(event => ({
          ...event,
          id: event.id.toString()
        }));
        
        setEvents(prevEvents => {
          const filteredEvents = prevEvents.filter(
            event => !supabaseEvents.some(supaEvent => supaEvent.id === event.id)
          );
          return [...filteredEvents, ...supabaseEvents];
        });
        
        if (githubLikesData && githubLikesData.length > 0) {
          setEventLikes(prev => ({
            ...prev,
            ...githubLikesMap
          }));
          
          localStorage.setItem('eventLikes', JSON.stringify({
            ...eventLikes,
            ...githubLikesMap
          }));
        }
      }
    } catch (error) {
      console.error('Error loading events from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      processGitHubEvents(githubEvents, isInitialLoad);
    } catch (error) {
      console.error(`Fehler beim Laden von ${EXTERNAL_EVENTS_URL}:`, error);
      console.log("Verwende lokale Beispieldaten, da keine externe Quelle verfügbar ist.");
      setEvents(prevEvents => {
        const userEvents = prevEvents.filter(event => !bielefeldEvents.some(bEvent => bEvent.id === event.id));
        return [...userEvents, ...bielefeldEvents];
      });
    }
    
    setIsLoading(false);
  };

  const processGitHubEvents = async (githubEvents: GitHubEvent[], isInitialLoad = false) => {
    try {
      const currentYear = new Date().getFullYear();
      
      const { data: githubLikesData, error: githubLikesError } = await supabase
        .from('github_event_likes')
        .select('*');
      
      if (githubLikesError) {
        console.error('Error loading GitHub likes:', githubLikesError);
      }
      
      const githubLikesMap: Record<string, number> = {};
      if (githubLikesData) {
        githubLikesData.forEach(like => {
          githubLikesMap[like.event_id] = like.likes;
        });
      }
      
      const transformedEvents = githubEvents.map((githubEvent, index) => {
        let title = githubEvent.event;
        let location = "Bielefeld";
        let category = determineEventCategory(githubEvent.event.toLowerCase());
        
        const locationMatch = githubEvent.event.match(/\(@([^)]+)\)/);
        if (locationMatch) {
          title = githubEvent.event.replace(/\s*\(@[^)]+\)/, '');
          location = locationMatch[1];
        }
        
        let eventDate;
        try {
          const dateParts = githubEvent.date.split(', ');
          const dayOfWeek = dateParts[0];
          const dateNumbers = dateParts[1].split('.');
          
          const day = parseInt(dateNumbers[0], 10);
          const month = parseInt(dateNumbers[1], 10) - 1;
          
          eventDate = new Date(Date.UTC(currentYear, month, day));
          
          if (eventDate < new Date() && month < 6) {
            eventDate.setFullYear(currentYear + 1);
          }
          
          console.log(`Parsed GitHub event date: ${githubEvent.date} -> ${format(eventDate, 'yyyy-MM-dd')}`);
        } catch (err) {
          console.warn(`Could not parse date: ${githubEvent.date}`, err);
          eventDate = new Date();
        }
        
        const eventId = `github-${index}`;
        
        const likesCount = githubLikesMap[eventId] !== undefined ? githubLikesMap[eventId] : (eventLikes[eventId] || 0);
        
        return {
          id: eventId,
          title: title,
          description: `Mehr Informationen unter: ${githubEvent.link}`,
          date: format(eventDate, 'yyyy-MM-dd'),
          time: "19:00",
          location: location,
          organizer: "Liebefeld Community Bielefeld",
          category: category,
          likes: likesCount,
          link: githubEvent.link
        } as Event;
      });
      
      console.log(`Transformed ${transformedEvents.length} GitHub events successfully`);
      
      const newLikesMap: Record<string, number> = {...eventLikes};
      transformedEvents.forEach(event => {
        if (githubLikesMap[event.id] !== undefined) {
          newLikesMap[event.id] = githubLikesMap[event.id];
        }
      });
      
      setEventLikes(newLikesMap);
      localStorage.setItem('eventLikes', JSON.stringify(newLikesMap));
      
      setEvents(prevEvents => {
        const userEvents = prevEvents.filter(event => !event.id.startsWith('github-'));
        const combined = [...userEvents, ...transformedEvents];
        console.log(`Total combined events: ${combined.length} (${userEvents.length} user events + ${transformedEvents.length} GitHub events)`);
        return combined;
      });
    } catch (error) {
      console.error("Error processing GitHub events:", error);
      setEvents(prevEvents => {
        const userEvents = prevEvents.filter(event => !bielefeldEvents.some(bEvent => bEvent.id === event.id));
        return [...userEvents, ...bielefeldEvents];
      });
    }
  };

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

  const handleLikeEvent = async (eventId: string) => {
    try {
      setEventLikes(prev => {
        const currentLikes = prev[eventId] || 0;
        const updatedLikes = {
          ...prev,
          [eventId]: currentLikes + 1
        };
        
        localStorage.setItem('eventLikes', JSON.stringify(updatedLikes));
        return updatedLikes;
      });
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes: (event.likes || 0) + 1 } 
            : event
        )
      );
      
      if (eventId.startsWith('github-')) {
        const currentLikesValue = eventLikes[eventId] || 0;
        const newLikesValue = currentLikesValue + 1;
        
        const { error: updateError } = await supabase
          .from('github_event_likes')
          .update({ likes: newLikesValue })
          .eq('event_id', eventId);
          
        if (updateError) {
          console.error('Error updating GitHub event likes:', updateError);
        }
      } else if (!eventId.startsWith('github-')) {
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

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  console.log('Current date:', format(currentDate, 'yyyy-MM-dd'));
  console.log('Selected date:', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'null');
  console.log('Today date:', format(new Date(), 'yyyy-MM-dd'));
  
  const filteredEvents = selectedDate 
    ? events.filter(event => {
        try {
          if (!event.date) {
            console.warn('Event has no date property:', event);
            return false;
          }
          
          const eventDate = parseISO(event.date);
          eventDate.setHours(0, 0, 0, 0);
          
          const selectedDateMidnight = new Date(selectedDate);
          selectedDateMidnight.setHours(0, 0, 0, 0);
          
          console.log('Comparing event:', {
            eventId: event.id,
            eventTitle: event.title,
            eventDate: format(eventDate, 'yyyy-MM-dd'),
            selectedDate: format(selectedDateMidnight, 'yyyy-MM-dd'),
            isMatch: isSameDay(eventDate, selectedDateMidnight)
          });
          
          const matchesDay = isSameDay(eventDate, selectedDateMidnight);
          const matchesFilter = filter ? event.category === filter : true;
          
          return matchesDay && matchesFilter;
        } catch (error) {
          console.error(`Error comparing dates for event ${event.id}:`, error);
          return false;
        }
      })
    : [];

  const favoriteEvents = events.filter(event => {
    if (event.id.startsWith('github-')) {
      return eventLikes[event.id] && eventLikes[event.id] > 0;
    }
    return event.likes && event.likes > 0;
  });

  const currentMonthEvents = events
    .filter(event => {
      try {
        if (showFavorites) {
          if (event.id.startsWith('github-')) {
            return eventLikes[event.id] && eventLikes[event.id] > 0;
          }
          return event.likes && event.likes > 0;
        }
        
        const eventDate = parseISO(event.date);
        return isSameMonth(eventDate, currentDate);
      } catch (error) {
        console.error(`Error filtering month events for event ${event.id}:`, error);
        return false;
      }
    })
    .sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      
      if (likesA !== likesB) {
        return likesB - likesA;
      }
      
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error('Error sorting events by date:', error);
        return 0;
      }
    });

  const eventsByDate = currentMonthEvents.reduce((acc, event) => {
    const dateStr = event.date;
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const handleDateClick = (day: Date) => {
    console.log('Date clicked:', format(day, 'yyyy-MM-dd'));
    setSelectedDate(day);
    setSelectedEvent(null);
  };

  const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      const tempId = `temp-${Math.random().toString(36).substring(2, 9)}`;
      const eventWithId = {
        ...newEvent,
        id: tempId,
        likes: 0
      };
      
      setEvents(prevEvents => [...prevEvents, eventWithId]);
      
      setShowEventForm(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const hasEvents = (day: Date) => {
    return events.some(event => {
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, day);
      } catch (error) {
        console.error(`Error checking if day has events: ${day}, event date: ${event.date}`, error);
        return false;
      }
    });
  };

  const getEventCount = (day: Date) => {
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, day);
      } catch (error) {
        console.error(`Error getting event count for day: ${day}, event date: ${event.date}`, error);
        return false;
      }
    }).length;
  };

  const toggleFilter = (category: string) => {
    setFilter(current => current === category ? null : category);
  };

  const toggleFavorites = () => {
    setShowFavorites(prev => !prev);
    
    if (!showFavorites) {
      setSelectedDate(null);
    }
  };

  const categories = Array.from(new Set(events.map(event => event.category)));

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
        
        <div className="flex justify-center items-center flex-col">
          <Tabs 
            defaultValue={view} 
            value={view} 
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

            {showEventForm && (
              <div className="w-full mt-4 mb-4 dark-glass-card rounded-2xl p-6 animate-fade-down animate-duration-300">
                <EventForm 
                  selectedDate={selectedDate ? selectedDate : new Date()} 
                  onAddEvent={handleAddEvent}
                  onCancel={() => setShowEventForm(false)}
                />
              </div>
            )}
            
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
                      <div className="grid grid-cols-7 mb-4">
                        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
                          <div key={day} className="text-center font-medium text-gray-400">
                            {day}
                          </div>
                        ))}
                      </div>
                      
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
        
        <EventDetails 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      </div>
    </div>
  );
};

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
