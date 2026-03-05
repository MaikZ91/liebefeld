
import React, { useState } from 'react';
import { Event } from '@/types/eventTypes';
import EventCard from './EventCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!events.length) return null;

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-900/20 rounded-lg"
      >
        <span className="font-medium">Hochschulsport Events ({events.length})</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      
      {isExpanded && (
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
      )}
    </div>
  );
};

export default UniversitySportsEvents;
