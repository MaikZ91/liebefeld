
import React from 'react';
import EventPanel from './EventPanel';

interface Event {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
}

interface EventListProps {
  events: Event[];
  title?: string;
}

const EventList: React.FC<EventListProps> = ({ events, title }) => {
  if (!events || events.length === 0) {
    return <p className="text-white">Keine Events gefunden.</p>;
  }

  return (
    <div className="space-y-2">
      {title && <h3 className="font-medium text-sm text-red-600 dark:text-red-400 mb-2">{title}</h3>}
      <div className="event-list-container">
        <style jsx>{`
          .event-title {
            color: black !important;
            font-weight: bold;
          }
        `}</style>
        {events.map((event, index) => (
          <EventPanel key={index} event={event} />
        ))}
      </div>
    </div>
  );
};

export default EventList;
