
import React from 'react';
import EventPanel from './EventPanel';
import './MessageList.css';

interface EventListProps {
  events: any[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  return (
    <div className="event-list-container">
      {events.map((event, index) => (
        <EventPanel key={index} event={event} />
      ))}
    </div>
  );
};

export default EventList;
