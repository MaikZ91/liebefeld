import React, { useState, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event, RsvpOption } from '@/types/eventTypes';
import EventDetails from '@/components/EventDetails';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';

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
            filteredEvents.map(event => (
              <div 
                key={event.id}
                id={`event-${event.id}`}
                className="mb-2 cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => onEventSelect(event)}
              >
                <div className="text-white font-medium">{event.title}</div>
                <div className="text-gray-300 text-sm">{event.time} - {event.location}</div>
              </div>
            ))
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
