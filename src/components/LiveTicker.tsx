
import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { format, parseISO, isAfter, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from './EventCalendar';

interface LiveTickerProps {
  events: Event[];
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events }) => {
  const [tickerEvents, setTickerEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Process all events for the ticker (both GitHub and user-added)
  useEffect(() => {
    if (events.length === 0) return;
    
    // Sort all events by date (most recent first)
    const sortedEvents = [...events].sort((a, b) => {
      try {
        return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      } catch (error) {
        console.error(`Error sorting dates: ${a.date}, ${b.date}`, error);
        return 0;
      }
    });
    
    // Limit to 20 events for better performance
    const limitedEvents = sortedEvents.slice(0, 20);
    
    setTickerEvents(limitedEvents);
    console.log(`LiveTicker: Displaying ${limitedEvents.length} events (from ${events.length} total)`);
  }, [events]);

  // Don't render if no events
  if (events.length === 0) {
    console.log('LiveTicker: No events to display');
    return null;
  }

  return (
    <div 
      className="bg-black text-white overflow-hidden py-2 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 bg-red-600 px-3 py-2">
        <Calendar className="w-4 h-4 mr-1" />
        <span className="font-bold text-sm whitespace-nowrap">Events</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
      
      {/* Gradient fades */}
      <div className="absolute left-[100px] top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
      
      {/* Scrolling content */}
      <div className="ml-[120px] mr-2 overflow-hidden">
        <div 
          ref={tickerRef}
          className={`whitespace-nowrap inline-block ${isPaused ? 'ticker-paused' : 'ticker-scroll'}`}
        >
          {[...tickerEvents, ...tickerEvents].map((event, index) => (
            <div 
              key={`${event.id}-${index}`} 
              className="inline-block mx-4"
            >
              <span className="inline-flex items-center">
                <span className="text-red-500 font-semibold mr-1">
                  {(() => {
                    try {
                      const date = parseISO(event.date);
                      return format(date, 'dd.MM', { locale: de });
                    } catch (error) {
                      console.error(`Failed to format date: ${event.date}`, error);
                      return 'Datum?';
                    }
                  })()}:
                </span>
                <span className="text-white mr-1">{event.title}</span>
                <span className="text-gray-400 text-sm">({event.location || 'Keine Ortsangabe'})</span>
              </span>
              <span className="mx-3 text-red-500">•</span>
            </div>
          ))}
        </div>
      </div>
      
      <style>
        {`
          @keyframes ticker {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          
          .ticker-scroll {
            animation: ticker 30s linear infinite;
          }
          
          .ticker-paused {
            animation: ticker 30s linear infinite;
            animation-play-state: paused;
          }
        `}
      </style>
    </div>
  );
};

export default LiveTicker;
