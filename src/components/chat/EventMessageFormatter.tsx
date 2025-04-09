
import React from 'react';
import { Calendar, Clock, HelpCircle, MapPin, Users, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Event, normalizeRsvpCounts } from "@/types/eventTypes";

interface EventMessageFormatterProps {
  messageText: string;
  eventData?: Event;
  onRsvp?: (eventId: string, option: 'yes' | 'no' | 'maybe') => void;
}

export const formatEventMessage = (messageText: string, eventData?: Event, onRsvp?: (eventId: string, option: 'yes' | 'no' | 'maybe') => void) => {
  if (!eventData) return messageText;

  const rsvpCounts = normalizeRsvpCounts(eventData);
  const totalRsvp = rsvpCounts.yes + rsvpCounts.no + rsvpCounts.maybe;

  return (
    <div>
      <div className="mb-2 text-white" dangerouslySetInnerHTML={{ __html: messageText }} />
      
      <div className="mt-2 p-3 rounded-md bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-white">{eventData.title}</span>
        </div>
        <div className="text-xs text-white space-y-1.5">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1.5" />
            <span>{eventData.date} um {eventData.time}</span>
          </div>
          {eventData.location && (
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1.5" />
              <span>{eventData.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1.5" />
            <span>{eventData.category}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-primary/10">
            <div className="flex items-center text-white gap-1" title="Zusagen">
              <Check className="h-3.5 w-3.5 text-green-500" /> 
              <span className="font-medium">{rsvpCounts.yes}</span>
            </div>
            <div className="flex items-center text-white gap-1" title="Vielleicht">
              <HelpCircle className="h-3.5 w-3.5 text-yellow-500" /> 
              <span className="font-medium">{rsvpCounts.maybe}</span>
            </div>
            <div className="flex items-center text-white gap-1" title="Absagen">
              <X className="h-3.5 w-3.5 text-red-500" /> 
              <span className="font-medium">{rsvpCounts.no}</span>
            </div>
          </div>
          
          {onRsvp && (
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 bg-green-500/10 hover:bg-green-500/20 border-green-500/30 flex-1 text-white"
                onClick={() => onRsvp(eventData.id, 'yes')}
              >
                <Check className="h-3 w-3 mr-1.5" /> Zusagen
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 flex-1 text-white"
                onClick={() => onRsvp(eventData.id, 'maybe')}
              >
                <HelpCircle className="h-3 w-3 mr-1.5" /> Vielleicht
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 bg-red-500/10 hover:bg-red-500/20 border-red-500/30 flex-1 text-white"
                onClick={() => onRsvp(eventData.id, 'no')}
              >
                <X className="h-3 w-3 mr-1.5" /> Absagen
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
