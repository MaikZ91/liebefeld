
import React from 'react';
import { EventShare } from '@/types/chatTypes';
import { Calendar, Clock, MapPin, Heart, ExternalLink } from 'lucide-react';

export const EventMessageFormatter: React.FC<{ event: EventShare }> = ({ event }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-red-500/30 w-full max-w-full overflow-hidden break-words">
      <div className="text-lg font-semibold text-white mb-1">Geteiltes Event</div>
      <div className="text-2xl font-bold text-white break-words">{event.title}</div>
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center text-sm text-gray-300">
          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="break-words overflow-hidden">{event.date}</span>
        </div>
        
        {event.time && (
          <div className="flex items-center text-sm text-gray-300">
            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="break-words overflow-hidden">{event.time}</span>
          </div>
        )}
        
        {event.location && (
          <div className="flex items-center text-sm text-gray-300">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="break-words overflow-hidden">{event.location}</span>
          </div>
        )}
        
        {event.link && (
          <div className="flex items-center text-sm text-blue-400 hover:text-blue-300 mt-1">
            <ExternalLink className="h-4 w-4 mr-1 flex-shrink-0" />
            <a 
              href={event.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="break-words overflow-hidden underline"
            >
              Event-Link
            </a>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm bg-red-500 text-white inline-block px-2 py-0.5 rounded">
          {event.category || "Event"}
        </div>
        <div className="flex items-center">
          <Heart className="h-5 w-5 text-red-500" />
        </div>
      </div>
    </div>
  );
};

export default EventMessageFormatter;
