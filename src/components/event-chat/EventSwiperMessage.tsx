
import React from 'react';
import EventSwiper from './EventSwiper';

interface EventSwiperMessageProps {
  events?: any[];
}

const EventSwiperMessage: React.FC<EventSwiperMessageProps> = ({ events = [] }) => {
  return (
    <div className="my-4">
      <EventSwiper events={events} />
    </div>
  );
};

export default EventSwiperMessage;
