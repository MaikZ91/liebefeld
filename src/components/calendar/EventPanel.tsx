
import React from 'react';
import { format, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import EventDetails from '@/components/EventDetails';

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
  if (selectedEvent) {
    return (
      <EventDetails
        event={selectedEvent}
        onClose={onEventClose}
        onLike={() => onLike(selectedEvent.id)}
      />
    );
  }

  if (selectedDate && !showFavorites) {
    const isTodaySelected = isToday(selectedDate);
    
    // If a date is selected but no specific event, show the event list for that day
    return filteredEvents.length > 0 ? (
      <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-medium mb-4 text-white">
          {format(selectedDate, 'EEEE, d. MMMM', { locale: de })}
          {filter && <span className="ml-2 text-sm text-gray-400">({filter})</span>}
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => onEventSelect(event)}
              onLike={onLike}
            />
          ))}
        </div>
      </div>
    ) : (
      <div className="dark-glass-card rounded-2xl p-6 flex flex-col items-center justify-center h-[300px]">
        <CalendarIcon className="w-12 h-12 mb-4 text-gray-500" />
        <h3 className="text-xl font-medium text-white mb-2">
          {isTodaySelected ? "Noch keine Events heute" : "Keine Events"}
        </h3>
        <p className="text-center text-gray-400">
          {isTodaySelected 
            ? `Für heute sind noch keine Events${filter ? ` in der Kategorie "${filter}"` : ''} geplant.`
            : `Für den ${format(selectedDate, 'd. MMMM yyyy', { locale: de })} sind keine Events${filter ? ` in der Kategorie "${filter}"` : ''} geplant.`}
        </p>
        <Button
          className="mt-4 rounded-full"
          onClick={onShowEventForm}
        >
          <Plus className="w-4 h-4 mr-2" />
          Event erstellen
        </Button>
      </div>
    );
  }

  // Default state - no date selected
  return (
    <div className="dark-glass-card rounded-2xl p-6 flex flex-col items-center justify-center h-[300px]">
      <CalendarIcon className="w-12 h-12 mb-4 text-gray-500" />
      <h3 className="text-xl font-medium text-white mb-2">Event-Details</h3>
      <p className="text-center text-gray-400">
        Wähle ein Datum oder Event aus, um Details zu sehen.
      </p>
    </div>
  );
};

export default EventPanel;
