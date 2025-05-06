
import React from 'react';

interface Event {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
}

interface EventPanelProps {
  event: Event;
}

const EventPanel: React.FC<EventPanelProps> = ({ event }) => {
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-3">
      <div className="font-bold text-base mb-1" style={{color: 'black !important'}}>
        {event.title}
      </div>
      <div className="flex flex-col gap-1">
        {(event.date || event.time) && (
          <div className="flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{color: 'white'}}>{event.date ? `${event.date} ` : ''}{event.time || ''}</span>
          </div>
        )}
        
        {event.location && (
          <div className="flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 flex-shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={{color: 'white'}}>{event.location}</span>
          </div>
        )}
        
        {event.category && (
          <div className="mt-1">
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
