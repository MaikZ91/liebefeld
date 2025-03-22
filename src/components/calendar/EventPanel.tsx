
import React, { useState, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event, RsvpOption } from '@/types/eventTypes';
import EventDetails from '@/components/EventDetails';
import { Button } from '@/components/ui/button';
import { Calendar, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { Badge } from '@/components/ui/badge';

interface EventPanelProps {
  selectedDate: Date | null;
  selectedEvent: Event | null;
  filteredEvents: Event[];
  filter: string | null;
  onEventSelect: (event: Event) => void;
  onEventClose: () => void;
  onLike: (eventId: string) => void;
  onShowEventForm: () => void;
  showFavorites: boolean;
}

const EventPanel: React.FC<EventPanelProps> = ({
  selectedDate,
  selectedEvent,
  filteredEvents,
  filter,
  onEventSelect,
  onEventClose,
  onLike,
  onShowEventForm,
  showFavorites
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Destructure context to get handleRsvpEvent
  const { handleRsvpEvent } = useEventContext();
  
  // Function to scroll the selected event into view
  useEffect(() => {
    if (selectedEvent && panelRef.current) {
      const selectedEventElement = document.getElementById(`event-${selectedEvent.id}`);
      if (selectedEventElement) {
        selectedEventElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedEvent, filteredEvents]);
  
  // Handler for toggling the event form
  const handleAddEventClick = () => {
    onShowEventForm();
  };
  
  // RSVP handler
  const handleRsvp = (option: RsvpOption) => {
    if (selectedEvent) {
      handleRsvpEvent(selectedEvent.id, option);
    }
  };
  
  // Helper to get RSVP counts
  const getRsvpCounts = (event: Event) => {
    // Handle both old rsvp object format and new individual rsvp fields
    return {
      yes: event.rsvp?.yes ?? event.rsvp_yes ?? 0,
      no: event.rsvp?.no ?? event.rsvp_no ?? 0,
      maybe: event.rsvp?.maybe ?? event.rsvp_maybe ?? 0
    };
  };
  
  return (
    <div className="h-full dark-glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-white">
          {selectedDate
            ? format(selectedDate, 'EEEE, d. MMMM', { locale: de })
            : "Event Details"}
        </h3>
        
        {!showFavorites && (
          <Button 
            variant="secondary" 
            size="sm"
            className="rounded-full"
            onClick={handleAddEventClick}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Event erstellen
          </Button>
        )}
      </div>
      
      {selectedEvent && (
        <EventDetails 
          event={selectedEvent} 
          onClose={onEventClose} 
          onLike={() => onLike(selectedEvent.id)} 
          onRsvp={handleRsvp}
        />
      )}
      
      {!selectedEvent && selectedDate && (
        <div ref={panelRef} className="overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
              const rsvpCounts = getRsvpCounts(event);
              
              return (
                <div 
                  key={event.id}
                  id={`event-${event.id}`}
                  className="mb-3 cursor-pointer hover:opacity-75 transition-opacity bg-gray-800/30 p-3 rounded-lg border border-gray-700/30"
                  onClick={() => onEventSelect(event)}
                >
                  <div className="text-white font-medium">{event.title}</div>
                  <div className="text-gray-300 text-sm">{event.time} - {event.location}</div>
                  
                  {/* RSVP counts */}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <ThumbsUp className="h-3 w-3 text-green-500" />
                      {rsvpCounts.yes}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <ThumbsDown className="h-3 w-3 text-red-500" />
                      {rsvpCounts.no}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <HelpCircle className="h-3 w-3 text-yellow-500" />
                      {rsvpCounts.maybe}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 italic">Keine Events an diesem Tag.</div>
          )}
        </div>
      )}
      
      {!selectedDate && !selectedEvent && (
        <div className="text-gray-400 italic">Bitte wähle ein Datum aus, um die Events anzuzeigen.</div>
      )}
    </div>
  );
};

export default EventPanel;
