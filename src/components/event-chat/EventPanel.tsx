
import React from 'react';
import { MessageSquare } from 'lucide-react';
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
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2 mb-2 relative">
      <div className="font-bold text-sm mb-1 text-white !important" style={{color: 'white !important'}}>
        {event.title}
      </div>
      <div className="flex flex-col gap-1">
        {/* Combined date/time and location in a single row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-xs">
            {(event.date || event.time) && (
              <div className="flex items-center text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span style={{color: 'white'}}>{event.date ? `${event.date} ` : ''}{event.time || ''}</span>
              </div>
            )}
            
            <span style={{color: 'white'}} className="mx-1">•</span>
            
            {event.location && (
              <div className="flex items-center text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span style={{color: 'white'}} className="truncate max-w-[120px]">{event.location}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons positioned higher up, before category badge */}
        <div className="flex justify-end gap-1 mt-0.5">
          <Button 
            onClick={handleJoinChat}
            className="bg-red-800/50 hover:bg-red-700/60 text-white text-xs px-2 py-0.5 h-auto rounded"
            disabled={!event.id}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Join Chat
          </Button>
          <button className="bg-red-800/50 hover:bg-red-700/60 text-white text-xs px-2 py-0.5 rounded">
            Share
          </button>
          <button className="bg-red-800/50 hover:bg-red-700/60 text-white text-xs px-2 py-0.5 rounded">
            Add
          </button>
        </div>
        
        {event.category && (
          <div>
            <span className="bg-red-500/70 text-white text-xs px-2 py-0.5 rounded inline-block">
              {event.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPanel;
