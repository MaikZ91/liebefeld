
import React from 'react';
import { Event } from '@/types/eventTypes';
import EventCard from './EventCard';

interface UniversitySportsEventsProps {
  events: Event[];
  onEventSelect: (event: Event, date: Date) => void;
  onDislike?: (eventId: string) => void;
}

const UniversitySportsEvents: React.FC<UniversitySportsEventsProps> = ({
  events,
  onEventSelect,
  onDislike,
}) => {
  if (!events.length) return null;

  return (
    <div className="space-y-1">
      <div className="p-2">
        <span className="font-medium">Hochschulsport Events ({events.length})</span>
      </div>
      <div className="space-y-1 pl-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            compact={true}
            onClick={() => onEventSelect(event, new Date(event.date))}
            onDislike={onDislike}
          />
        ))}
      </div>
    </div>
  );
};

export default UniversitySportsEvents;
