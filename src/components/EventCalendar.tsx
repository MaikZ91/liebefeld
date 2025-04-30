import React, { useState, useCallback } from 'react';
import { format, isSameDay, parseISO, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { useEventContext } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  PlusCircle,
  ThumbsUp,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Event } from '@/types/eventTypes';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EventForm from './EventForm';
import { groupEventsByDate, hasEventsOnDay } from '@/utils/eventUtils';
import { toast } from 'sonner';

interface EventCalendarProps {
  defaultView?: "calendar" | "list";
}

function EventCalendar({ defaultView = "calendar" }: EventCalendarProps) {
  const { events, isLoadingEvents, toggleLike, updateRSVP } = useEventContext();
  const [view, setView] = useState<"calendar" | "list">(defaultView);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);
  
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  }, []);

  const handleCloseEventDetails = useCallback(() => {
    setIsEventDetailsOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleAddEventClick = useCallback(() => {
    setIsAddEventOpen(true);
  }, []);

  const handleAddEventSuccess = useCallback(() => {
    setIsAddEventOpen(false);
    setIsAddSidebarOpen(false);
    toast.success("Event erfolgreich erstellt!", {
      description: "Dein Event wurde zum Kalender hinzugefügt.",
    });
  }, []);

  const handleLike = useCallback(async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(event.id);
  }, [toggleLike]);

  const handleRSVP = useCallback(async (event: Event, status: 'yes' | 'no' | 'maybe', e: React.MouseEvent) => {
    e.stopPropagation();
    await updateRSVP(event.id, status);
    toast.success(`RSVP als "${status}" gespeichert!`);
  }, [updateRSVP]);

  // Group events by date for list view
  const eventsByDate = groupEventsByDate(events as any[]);

  // Get events for selected date in calendar view
  const eventsForSelectedDate = events.filter(event => {
    const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
    return isSameDay(eventDate, selectedDate);
  });

  // Function to determine if a date has events
  const hasEvents = useCallback((date: Date) => {
    return hasEventsOnDay(events, date);
  }, [events]);

  // Fix: Use className instead of dayClassName
  const getDayClassName = useCallback((date: Date) => {
    const isWeekend = [0, 6].includes(getDay(date));
    const hasEventsOnDay = hasEvents(date);
    
    let classNames = "";
    
    if (isWeekend) classNames += "bg-muted hover:bg-accent ";
    if (hasEventsOnDay) classNames += "font-bold ";
    classNames += "hover:bg-accent hover:text-accent-foreground";
    
    return classNames;
  }, [hasEvents]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Events</h2>
        <div className="flex gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <CalendarIcon className="h-4 w-4 mr-1" /> Kalender
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4 mr-1" /> Liste
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddEventClick}
            className="ml-2"
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Event
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoadingEvents ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {view === "calendar" && (
              <div className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border shadow pointer-events-auto"
                  locale={de}
                  weekStartsOn={1}
                  disabled={() => false}
                  modifiers={{
                    hasEvent: (date) => hasEvents(date)
                  }}
                  modifiersClassNames={{
                    hasEvent: "font-bold"
                  }}
                />

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Events am {format(selectedDate, "dd.MM.yyyy", { locale: de })}
                  </h3>
                  
                  {eventsForSelectedDate.length === 0 ? (
                    <p className="text-gray-500">Keine Events an diesem Tag.</p>
                  ) : (
                    <div className="space-y-2">
                      {eventsForSelectedDate.map(event => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-gray-500">
                                {event.time} • {event.location || 'Kein Ort angegeben'}
                              </p>
                            </div>
                            <Badge variant="outline">{event.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === "list" && (
              <div className="divide-y">
                {Object.entries(eventsByDate).map(([date, dateEvents]) => (
                  <div key={date} className="p-4">
                    <h3 className="text-lg font-semibold mb-3">{date}</h3>
                    <div className="space-y-3">
                      {dateEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-gray-500">
                                {event.time} • {event.location || 'Kein Ort angegeben'}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2 whitespace-nowrap">{event.category}</Badge>
                          </div>
                          
                          <div className="flex mt-2 items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center gap-1 h-7 px-2"
                              onClick={(e) => handleLike(event, e)}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" /> 
                              <span>{event.likes || 0}</span>
                            </Button>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex items-center gap-1 h-7 px-2 text-green-500"
                                    onClick={(e) => handleRSVP(event, 'yes', e)}
                                  >
                                    <Check className="h-3.5 w-3.5" /> 
                                    <span>{event.rsvp_yes || 0}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ich nehme teil</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex items-center gap-1 h-7 px-2 text-red-500"
                                    onClick={(e) => handleRSVP(event, 'no', e)}
                                  >
                                    <X className="h-3.5 w-3.5" /> 
                                    <span>{event.rsvp_no || 0}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ich nehme nicht teil</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex items-center gap-1 h-7 px-2 text-yellow-500"
                                    onClick={(e) => handleRSVP(event, 'maybe', e)}
                                  >
                                    <HelpCircle className="h-3.5 w-3.5" /> 
                                    <span>{event.rsvp_maybe || 0}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Vielleicht</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(eventsByDate).length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">Keine anstehenden Events.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={handleCloseEventDetails}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedEvent.date), "EEEE, dd.MM.yyyy", { locale: de })} um {selectedEvent.time}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedEvent.location && (
                  <div>
                    <h4 className="text-sm font-medium">Ort</h4>
                    <p>{selectedEvent.location}</p>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div>
                    <h4 className="text-sm font-medium">Beschreibung</h4>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}
                
                {selectedEvent.organizer && (
                  <div>
                    <h4 className="text-sm font-medium">Veranstalter</h4>
                    <p>{selectedEvent.organizer}</p>
                  </div>
                )}
                
                {selectedEvent.link && (
                  <div>
                    <h4 className="text-sm font-medium">Link</h4>
                    <a 
                      href={selectedEvent.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedEvent.link}
                    </a>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Badge variant="outline">{selectedEvent.category}</Badge>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => handleLike(selectedEvent, e)}
                    >
                      <ThumbsUp className="h-4 w-4" /> 
                      <span>{selectedEvent.likes || 0}</span>
                    </Button>
                    
                    <div className="flex gap-1 items-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center justify-center w-8 h-8 p-0 text-green-500"
                        onClick={(e) => handleRSVP(selectedEvent, 'yes', e)}
                        title="Teilnehmen"
                      >
                        <Check className="h-4 w-4" /> 
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center justify-center w-8 h-8 p-0 text-red-500"
                        onClick={(e) => handleRSVP(selectedEvent, 'no', e)}
                        title="Absagen"
                      >
                        <X className="h-4 w-4" /> 
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center justify-center w-8 h-8 p-0 text-yellow-500"
                        onClick={(e) => handleRSVP(selectedEvent, 'maybe', e)}
                        title="Vielleicht"
                      >
                        <HelpCircle className="h-4 w-4" /> 
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event hinzufügen</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Event für die Community.
            </DialogDescription>
          </DialogHeader>
          <EventForm 
            onSuccess={handleAddEventSuccess} 
            selectedDate={selectedDate} 
          />
        </DialogContent>
      </Dialog>

      {/* Add Event Sidebar (for mobile) */}
      <Sheet open={isAddSidebarOpen} onOpenChange={setIsAddSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="fixed bottom-6 right-6 z-10 rounded-full shadow-lg md:hidden"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-4/5">
          <SheetHeader>
            <SheetTitle>Event hinzufügen</SheetTitle>
            <SheetDescription>
              Erstelle ein neues Event für die Community.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100%-5rem)]">
            <EventForm 
              onSuccess={handleAddEventSuccess} 
              selectedDate={selectedDate}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default EventCalendar;
