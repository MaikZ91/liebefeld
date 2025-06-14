
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
  const { newEventIds } = useEventContext();
  
  const panelTitle = selectedDate 
    ? `Events am ${format(selectedDate, 'dd. MMMM', { locale: de })}`
    : filter 
      ? `${filter} Events` 
      : showFavorites 
        ? "Meine Favoriten" 
        : "Events";
  
  return (
    <div className="dark-glass-card rounded-xl p-3 h-full animate-fade-in w-full">
      {!selectedEvent && (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white">{selectedEvent.title}</h3>
            <Button variant="ghost" size="icon" onClick={onEventClose} className="h-6 w-6 p-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-3 h-3"><path d="M18 6 6 18"/><path d="M6 6 18 18"/></svg>
            </Button>
          </div>
          
          <div className="overflow-y-auto pr-1 scrollbar-thin flex-grow">
            <div className="flex items-center text-xs text-gray-300 mb-2">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>{selectedEvent.date && format(new Date(selectedEvent.date), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
              <span className="mx-1">•</span>
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{selectedEvent.location}</span>
              {selectedEvent.source === 'github' && (
                <>
                  <span className="mx-1">•</span>
                  <span className="text-blue-400 text-xs">GitHub Event</span>
                </>
              )}
            </div>
            
            <p className="text-gray-300 mb-3 text-xs">{selectedEvent.description}</p>
            
            {selectedEvent.link && (
              <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 flex items-center mb-2 text-xs">
                <Link className="mr-1 h-3 w-3" />
                Mehr Informationen
              </a>
            )}
            
            {selectedEvent.image_url && (
              <div className="mb-3">
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          
          <div className="mt-auto flex justify-between items-center">
            <Button 
              variant="outline" 
              className="bg-black/50 text-white hover:bg-black/70 text-xs h-7 px-2"
              onClick={() => onLike(selectedEvent.id)}
            >
              <Heart className="mr-1 h-3 w-3" fill={selectedEvent.likes && selectedEvent.likes > 0 ? 'white' : 'none'} />
              {selectedEvent.likes || 0}
            </Button>
            <Button onClick={onShowEventForm} className="text-xs h-7 px-2">Bearbeiten</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPanel;
