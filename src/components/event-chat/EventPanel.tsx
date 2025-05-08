
import React from 'react';

interface Event {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  link?: string;
}

interface EventPanelProps {
  event: Event;
}

const EventPanel: React.FC<EventPanelProps> = ({ event }) => {
  const renderTitle = () => {
    if (event.link) {
      return (
        <a 
          href={event.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="font-bold text-base mb-1 hover:underline flex items-center gap-1"
          style={{
            color: '#ef4444', // red-500
            opacity: '1 !important',
            mixBlendMode: 'normal',
            isolation: 'isolate'
          }}
        >
          {event.title}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      );
    }
    
    return (
      <div 
        className="font-bold text-base mb-1" 
        style={{
          color: 'black',
          opacity: '1 !important',
          mixBlendMode: 'normal',
          isolation: 'isolate'
        }}
      >
        {event.title}
      </div>
    );
  };
  
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-3 hover:bg-red-900/30 transition-colors">
      {renderTitle()}
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
