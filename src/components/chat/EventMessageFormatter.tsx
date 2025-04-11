
import React from 'react';
import { EventShare } from '@/types/chatTypes';
import { Calendar, Clock, MapPin } from 'lucide-react';

export const EventMessageFormatter: React.FC<{ event: EventShare }> = ({ event }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-red-500/30 w-full max-w-full overflow-hidden break-words">
      <div className="text-sm font-semibold text-white mb-1">Geteiltes Event</div>
      <div className="text-lg font-bold text-white break-words">{event.title}</div>
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center text-xs text-gray-300">
          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="break-words overflow-hidden">{event.date}</span>
        </div>
        
        {event.time && (
          <div className="flex items-center text-xs text-gray-300">
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words overflow-hidden">{event.time}</span>
          </div>
        )}
        
        {event.location && (
          <div className="flex items-center text-xs text-gray-300">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="break-words overflow-hidden">{event.location}</span>
          </div>
        )}
      </div>
      <div className="text-xs bg-red-500 text-white inline-block px-2 py-0.5 rounded mt-2">
        {event.category || "Event"}
      </div>
    </div>
  );
};

export default EventMessageFormatter;
