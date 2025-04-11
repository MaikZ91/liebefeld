
import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPin, Heart, Link } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import EventCard from '@/components/EventCard';

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
  const { eventLikes, newEventIds } = useEventContext();
  
  // If we're on list view with a filter applied, let's make sure we show the right title
  const panelTitle = selectedDate 
    ? `Events am ${format(selectedDate, 'dd. MMMM', { locale: de })}`
    : filter 
      ? `${filter} Events` 
      : showFavorites 
        ? "Meine Favoriten" 
        : "Events";
  
  return (
    <div className="dark-glass-card rounded-xl p-4 h-full animate-fade-in w-full">
      {!selectedEvent && (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-medium text-white">{panelTitle}</h3>
            {selectedDate && (
              <span className="text-sm text-gray-300">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            )}
          </div>
          
          {selectedDate ? (
            <div className="overflow-y-auto pr-1 scrollbar-thin">
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {filteredEvents.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event}
                      compact={true}
                      onClick={() => onEventSelect(event)}
                      onLike={onLike}
                      className={newEventIds.has(event.id) ? 'border-l-2 border-green-500' : ''}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  Keine Events an diesem Tag
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Bitte wähle ein Datum aus
            </div>
          )}
        </div>
      )}
      
      {selectedEvent && (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-medium text-white">{selectedEvent.title}</h3>
            <Button variant="ghost" size="icon" onClick={onEventClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-4 h-4"><path d="M18 6 6 18"/><path d="M6 6 18 18"/></svg>
            </Button>
          </div>
          
          <div className="overflow-y-auto pr-1 scrollbar-thin flex-grow">
            <div className="text-gray-300 mb-2 flex items-center text-sm">
              <CalendarIcon className="mr-1 h-4 w-4" />
              {selectedEvent.date && format(new Date(selectedEvent.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </div>
            
            <div className="text-gray-300 mb-2 flex items-center text-sm">
              <MapPin className="mr-1 h-4 w-4" />
              {selectedEvent.location}
            </div>
            
            <p className="text-gray-300 mb-3 text-sm">{selectedEvent.description}</p>
            
            {selectedEvent.link && (
              <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 flex items-center mb-3 text-sm">
                <Link className="mr-1 h-4 w-4" />
                Mehr Informationen
              </a>
            )}
          </div>
          
          <div className="mt-auto flex justify-between items-center">
            <Button 
              variant="outline" 
              className="bg-black/50 text-white hover:bg-black/70 text-sm h-8 px-3"
              onClick={() => onLike(selectedEvent.id)}
            >
              <Heart className="mr-1 h-4 w-4" fill={eventLikes[selectedEvent.id] ? 'white' : 'none'} />
              {eventLikes[selectedEvent.id] || 0}
            </Button>
            <Button onClick={onShowEventForm} className="text-sm h-8 px-3">Bearbeiten</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPanel;
