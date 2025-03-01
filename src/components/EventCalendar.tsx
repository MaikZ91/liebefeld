
import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EventDetails from './EventDetails';
import EventCard from './EventCard';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EventForm from './EventForm';
import { toast } from "@/components/ui/use-toast";

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
}

// JSON-Beispiel, falls die externe Quelle nicht verfügbar ist
const SAMPLE_EVENTS = [
  {
    "id": "event1",
    "title": "Coding Meetup",
    "description": "Gemeinsames Programmieren und Austausch über aktuelle Technologien",
    "start_date": "2024-05-15T18:30:00+02:00",
    "location": {
      "name": "Founders Foundation",
      "city": "Bielefeld",
      "street": "Obernstraße 50"
    },
    "organizer": "Code for Bielefeld",
    "category": "Workshop"
  },
  {
    "id": "event2",
    "title": "Offener Stammtisch",
    "description": "Lockeres Treffen zum Austausch über lokale Themen",
    "start_date": "2024-05-20T19:00:00+02:00",
    "location": {
      "name": "Café Lieblings",
      "city": "Bielefeld",
      "street": "Arndtstraße 7"
    },
    "organizer": "Bielefeld Community",
    "category": "Networking"
  },
  {
    "id": "event3",
    "title": "Urban Gardening Workshop",
    "description": "Praktische Tipps zum Gärtnern in der Stadt",
    "start_date": "2024-05-25T10:00:00+02:00",
    "location": {
      "name": "Transition Town Bielefeld",
      "city": "Bielefeld",
      "street": "Metzer Straße 20"
    },
    "organizer": "Nachhaltig in Bielefeld",
    "category": "Workshop"
  },
  {
    "id": "event4",
    "title": "Radtour durch Bielefeld",
    "description": "Gemeinsame Radtour durch die schönsten Ecken der Stadt",
    "start_date": "2024-05-30T14:00:00+02:00",
    "location": {
      "name": "Kesselbrink",
      "city": "Bielefeld",
      "street": ""
    },
    "organizer": "ADFC Bielefeld",
    "category": "Sport"
  }
];

// URL zur JSON-Datei mit Events - mit Fallback auf eine alternative Quelle
const EXTERNAL_EVENTS_URLS = [
  "https://raw.githubusercontent.com/codeforbielefeld/teuto-events/main/events.json",
  "https://raw.githubusercontent.com/codeforbielefeld/events/main/events.json"
];

interface ExternalEvent {
  id: string;
  title: string;
  description: string;
  start_date: string; // Format: "2024-05-28T19:00:00+02:00"
  end_date?: string;
  location?: {
    name?: string;
    city?: string;
    street?: string;
  };
  url?: string;
  organizer?: string;
  category?: string;
}

const EventCalendar = () => {
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(() => {
    const savedEvents = localStorage.getItem('communityEvents');
    return savedEvents ? JSON.parse(savedEvents) : sampleEvents;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('communityEvents', JSON.stringify(events));
  }, [events]);

  // Lade externe Events beim Start
  useEffect(() => {
    fetchExternalEvents();
  }, []);

  // Funktion zum Laden externer Events
  const fetchExternalEvents = async () => {
    setIsLoading(true);
    let success = false;
    
    // Versuche die Events von einer der URLs zu laden
    for (const url of EXTERNAL_EVENTS_URLS) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.log(`Fehler beim Laden von ${url}: ${response.status}`);
          continue; // Versuche die nächste URL
        }
        
        const externalData: ExternalEvent[] = await response.json();
        processExternalEvents(externalData);
        success = true;
        break; // Erfolgreich geladen, breche die Schleife ab
      } catch (error) {
        console.error(`Fehler beim Laden von ${url}:`, error);
        // Versuche die nächste URL
      }
    }
    
    // Wenn keine externe Quelle erfolgreich war, verwende die Beispieldaten
    if (!success) {
      console.log("Verwende lokale Beispieldaten, da keine externe Quelle verfügbar ist.");
      processExternalEvents(SAMPLE_EVENTS);
    }
    
    setIsLoading(false);
  };
  
  // Verarbeite die externen Events
  const processExternalEvents = (externalData: ExternalEvent[]) => {
    // Transformiere externe Events in das interne Format
    const transformedEvents = externalData.map((extEvent) => {
      // Parsen des Datums und der Zeit
      const startDate = new Date(extEvent.start_date);
      
      return {
        id: extEvent.id || Math.random().toString(36).substring(2, 9),
        title: extEvent.title,
        description: extEvent.description || 'Keine Beschreibung verfügbar',
        date: startDate.toISOString().split('T')[0],
        time: format(startDate, 'HH:mm'),
        location: extEvent.location?.name 
          ? `${extEvent.location.name}${extEvent.location.street ? ', ' + extEvent.location.street : ''}${extEvent.location.city ? ', ' + extEvent.location.city : ''}`
          : 'Unbekannter Ort',
        organizer: extEvent.organizer || 'Unbekannter Veranstalter',
        category: extEvent.category || 'Meeting'
      } as Event;
    });
    
    // Kombiniere mit bestehenden lokalen Events
    const savedEvents = localStorage.getItem('communityEvents');
    const localEvents = savedEvents ? JSON.parse(savedEvents) : sampleEvents;
    
    // Entferne Duplikate (basierend auf ID)
    const mergedEvents = [...localEvents];
    
    transformedEvents.forEach(newEvent => {
      const exists = mergedEvents.some(event => event.id === newEvent.id);
      if (!exists) {
        mergedEvents.push(newEvent);
      }
    });
    
    setEvents(mergedEvents);
    toast({
      title: "Events aktualisiert",
      description: `${transformedEvents.length} Events wurden geladen.`,
    });
  };

  // Calendar navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Filter events for the selected date
  const selectedDateEvents = selectedDate 
    ? events.filter(event => isSameDay(parseISO(event.date), selectedDate))
    : [];
  
  // Handler for selecting a date
  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedEvent(null);
  };
  
  // Handler for adding a new event
  const handleAddEvent = (newEvent: Omit<Event, 'id'>) => {
    const eventWithId = {
      ...newEvent,
      id: Math.random().toString(36).substring(2, 9)
    };
    
    setEvents([...events, eventWithId as Event]);
    toast({
      title: "Event erstellt",
      description: `"${newEvent.title}" wurde erfolgreich zum Kalender hinzugefügt.`,
    });
  };

  // Check if a day has events
  const hasEvents = (day: Date) => {
    return events.some(event => isSameDay(parseISO(event.date), day));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
      <div className="flex flex-col space-y-6">
        {/* Calendar header with month navigation */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold">Community Kalender</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full hover:scale-105 transition-transform">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl md:text-2xl font-medium w-48 text-center">
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full hover:scale-105 transition-transform">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchExternalEvents}
              className="flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all"
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Events aktualisieren</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all">
                  <Plus className="h-5 w-5" />
                  <span className="hidden md:inline">Event erstellen</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect max-w-md sm:max-w-lg">
                <EventForm 
                  selectedDate={selectedDate ? selectedDate : new Date()} 
                  onAddEvent={handleAddEvent} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Main calendar grid */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-3/5 glass-card rounded-2xl p-6">
            {/* Day names header */}
            <div className="grid grid-cols-7 mb-4">
              {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-center font-medium text-muted-foreground">
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
                
                return (
                  <button
                    key={i}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "calendar-day hover-scale",
                      isSelected ? "active" : "",
                      !isCurrentMonth ? "text-muted-foreground/40" : "",
                      dayHasEvents ? "has-event" : "",
                      isCurrentDay ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Event list for selected date */}
          <div className="w-full md:w-2/5 glass-card rounded-2xl p-6 overflow-hidden flex flex-col">
            <h3 className="text-xl font-medium mb-4">
              {selectedDate ? (
                format(selectedDate, 'EEEE, d. MMMM', { locale: de })
              ) : (
                "Wähle ein Datum aus"
              )}
            </h3>
            
            <div className="flex-grow overflow-auto">
              {selectedDate ? (
                selectedDateEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateEvents.map(event => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Keine Events an diesem Tag
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Wähle ein Datum, um Events anzuzeigen
                </div>
              )}
            </div>
          </div>
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
const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Stammtisch',
    description: 'Monatliches Treffen der Community zum Austausch und Networking.',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: 'Café Zentral, Hauptstraße 1',
    organizer: 'Community Team',
    category: 'Networking'
  },
  {
    id: '2',
    title: 'Workshop: React Basics',
    description: 'Einführung in React für Anfänger. Grundlagen und erste Schritte.',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    location: 'Tech Hub, Innovationspark',
    organizer: 'Coding Club',
    category: 'Workshop'
  },
  {
    id: '3',
    title: 'Yoga im Park',
    description: 'Gemeinsames Yoga für alle Levels. Bitte Matte mitbringen.',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    time: '08:30',
    location: 'Stadtpark, Brunnen',
    organizer: 'Wellness Gruppe',
    category: 'Sport'
  }
];

export default EventCalendar;
