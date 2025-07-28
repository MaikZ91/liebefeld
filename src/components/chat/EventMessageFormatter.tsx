
import React from 'react';
import { EventShare } from '@/types/chatTypes';
import { Calendar, Clock, MapPin, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventMessageFormatterProps {
  event: EventShare;
  eventId?: string;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
}

export const EventMessageFormatter: React.FC<EventMessageFormatterProps> = ({ event, eventId, onJoinEventChat }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-red-500/30 w-full max-w-full overflow-hidden break-words">
      <div className="text-lg font-semibold text-white mb-1">Geteiltes Event</div>
      <div className="text-xl font-bold text-white !opacity-100 break-words">{event.title}</div>
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center text-sm text-white">
          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="break-words overflow-hidden">{event.date}</span>
        </div>
        
        {event.time && (
          <div className="flex items-center text-sm text-white">
            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="break-words overflow-hidden">{event.time}</span>
          </div>
        )}
        
        {event.location && (
          <div className="flex items-center text-sm text-white">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="break-words overflow-hidden">{event.location}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm bg-red-500 text-white inline-block px-2 py-0.5 rounded">
          {event.category || "Event"}
        </div>
        <div className="flex items-center gap-2">
          {eventId && onJoinEventChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onJoinEventChat(eventId, event.title)}
              className="h-7 px-2 text-xs border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Event Chat
            </Button>
          )}
          <Heart className="h-5 w-5 text-red-500" />
        </div>
      </div>
    </div>
  );
};

export default EventMessageFormatter;
