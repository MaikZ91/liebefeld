
import React from 'react';
import { MessageSquare, Clock, MapPin, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Event {
  id?: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
}

interface EventPanelProps {
  event: Event;
  onJoinChat?: (eventId: string, eventTitle: string) => void;
}

const EventPanel: React.FC<EventPanelProps> = ({ event, onJoinChat }) => {
  const handleJoinChat = () => {
    if (onJoinChat && event.id) {
      onJoinChat(event.id, event.title);
    }
  };
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-3 hover:bg-card/80 transition-colors">
      <div className="flex items-start gap-4">
        {/* Event Image Placeholder */}
        <div className="w-16 h-16 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">
            {event.title.substring(0, 2).toUpperCase()}
          </span>
        </div>
        
        {/* Event Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2">
                {event.title}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                {(event.date || event.time) && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time || ''} • {event.location || ''}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>6 Zusagen</span>
              </div>
            </div>
            
            {/* Right side - Heart and stats */}
            <div className="flex flex-col items-end gap-2 ml-4">
              <button className="p-1 hover:bg-muted rounded">
                <Heart className="w-5 h-5 text-primary fill-primary" />
              </button>
              <span className="text-lg font-bold text-foreground">6</span>
              
              {event.category && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Neu
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPanel;
