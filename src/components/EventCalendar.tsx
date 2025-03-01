
import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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

const EventCalendar = () => {
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(() => {
    const savedEvents = localStorage.getItem('communityEvents');
    return savedEvents ? JSON.parse(savedEvents) : sampleEvents;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('communityEvents', JSON.stringify(events));
  }, [events]);

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
