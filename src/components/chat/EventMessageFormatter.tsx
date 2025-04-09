
import React from 'react';
import { EventShare } from '@/types/chatTypes';

export const EventMessageFormatter: React.FC<{ event: EventShare }> = ({ event }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 my-2 border border-red-500/30">
      <div className="text-sm font-semibold text-white mb-1">Geteiltes Event</div>
      <div className="text-lg font-bold text-white">{event.title}</div>
      <div className="text-xs text-gray-300 mt-1">
        <span>{event.date}</span>
        {event.time && <span> • {event.time}</span>}
        {event.location && <span> • {event.location}</span>}
      </div>
      <div className="text-xs bg-red-500 text-white inline-block px-2 py-0.5 rounded mt-2">
        {event.category || "Event"}
      </div>
    </div>
  );
};

export default EventMessageFormatter;
