
import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { format, parseISO, isAfter, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from './EventCalendar';

interface LiveTickerProps {
  events: Event[];
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events }) => {
  const [weeklyEvents, setWeeklyEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get events for the current week
  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 1 = Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    // Filter events within current week and sort by date
    const eventsThisWeek = events
      .filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
        } catch (error) {
          console.error(`Error parsing date: ${event.date}`, error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return parseISO(a.date).getTime() - parseISO(b.date).getTime();
        } catch (error) {
          console.error(`Error sorting dates: ${a.date}, ${b.date}`, error);
          return 0;
        }
      })
      .slice(0, 10); // Limit to 10 events
    
    setWeeklyEvents(eventsThisWeek);
    
    console.log(`LiveTicker: Found ${eventsThisWeek.length} events this week out of ${events.length} total events`);
    console.log(`Week range: ${format(weekStart, 'dd.MM.')} - ${format(weekEnd, 'dd.MM.')}`);
  }, [events]);

  // Make sure we always render the ticker if there are events, even if none are this week
  const eventsToShow = weeklyEvents.length > 0 ? weeklyEvents : events.slice(0, 10);

  // Don't render if no events at all
  if (events.length === 0) {
    console.log('LiveTicker: No events to display');
    return null;
  }

  return (
    <div 
      className="bg-black text-white overflow-hidden py-2 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={containerRef}
    >
      {/* Header */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 bg-red-600 px-3 py-2">
        <Calendar className="w-4 h-4 mr-1" />
        <span className="font-bold text-sm whitespace-nowrap">Neue Events</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
      
      {/* Gradient fades */}
      <div className="absolute left-[100px] top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
      
      {/* Scrolling content */}
      <div className="ml-[120px] mr-2 overflow-hidden">
        <div 
          ref={tickerRef}
          className={`whitespace-nowrap inline-block ${isPaused ? 'pause-animation' : 'animate-ticker'}`}
        >
          {[...eventsToShow, ...eventsToShow].map((event, index) => (
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
      
      {/* Define the animation in a style tag */}
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
          
          .animate-ticker {
            animation: ticker 30s linear infinite;
          }
          
          .pause-animation {
            animation-play-state: paused;
          }
        `}
      </style>
    </div>
  );
};

export default LiveTicker;
