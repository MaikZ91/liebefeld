
import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ArrowRight, ThumbsUp, BadgePlus } from 'lucide-react';
import { format, parseISO, isSameMonth, startOfDay, isAfter, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from '../types/eventTypes';
import { useEventContext } from '@/contexts/EventContext';

interface LiveTickerProps {
  events: Event[];
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events }) => {
  const [tickerEvents, setTickerEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const { newEventIds } = useEventContext();

  // Process events for the ticker - only the most popular event per day
  useEffect(() => {
    if (events.length === 0) return;
    
    try {
      console.log(`LiveTicker: Processing ${events.length} events for ticker`);
      
      // Get current month
      const currentDate = new Date();
      const today = startOfDay(new Date());
      
      // Filter events for current month only and ensure they're not in the past
      const currentMonthEvents = events.filter(event => {
        try {
          if (!event.date) return false;
          const eventDate = parseISO(event.date);
          
          // Only include events from today or future dates
          return isSameMonth(eventDate, currentDate) && (isAfter(eventDate, today) || isToday(eventDate));
        } catch (error) {
          console.error(`Error filtering for current month: ${event.date}`, error);
          return false;
        }
      });
      
      console.log(`LiveTicker: Found ${currentMonthEvents.length} events for current month`);
      
      // Group events by day
      const eventsByDay: Record<string, Event[]> = {};
      
      currentMonthEvents.forEach(event => {
        try {
          if (!event.date) return;
          
          // Use just the date part for grouping
          const eventDate = parseISO(event.date);
          const dateKey = format(eventDate, 'yyyy-MM-dd');
          
          if (!eventsByDay[dateKey]) {
            eventsByDay[dateKey] = [];
          }
          
          eventsByDay[dateKey].push(event);
        } catch (error) {
          console.error(`Error grouping events by day: ${event.date}`, error);
        }
      });
      
      // Get the top event (most likes) for each day
      const topEventsByDay = Object.keys(eventsByDay).map(dateKey => {
        const dayEvents = eventsByDay[dateKey];
        
        // Sort by likes (highest first)
        return dayEvents.sort((a, b) => {
          const likesA = a.likes || 0;
          const likesB = b.likes || 0;
          return likesB - likesA;
        })[0]; // Take only the top event
      });
      
      console.log(`LiveTicker: Found ${topEventsByDay.length} top events for the current month`);
      
      // Sort by date (closest first)
      const sortedTopEvents = topEventsByDay.sort((a, b) => {
        try {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error(`Error sorting top events by date: ${a.date}, ${b.date}`, error);
          return 0;
        }
      });
      
      if (sortedTopEvents.length > 0) {
        console.log(`Top event today: ${sortedTopEvents[0]?.title} with ${sortedTopEvents[0]?.likes || 0} likes`);
      }
      
      setTickerEvents(sortedTopEvents);
    } catch (error) {
      console.error("Error processing events for ticker:", error);
    }
  }, [events]);

  // Don't render if no events
  if (!tickerEvents.length) {
    console.log('LiveTicker: No top events to display');
    return null;
  }

  return (
    <div 
      className="text-white overflow-hidden py-1 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 bg-red-600 px-3 py-1">
        <Calendar className="w-4 h-4 mr-1" />
        <span className="font-bold text-sm whitespace-nowrap">Top Events</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
      
      {/* Gradient fades */}
      <div className="absolute left-[110px] top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
      
      {/* Scrolling content */}
      <div className="ml-[130px] mr-2 overflow-hidden">
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
                {newEventIds.has(event.id) && (
                  <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 mx-1">
                    <BadgePlus className="w-3 h-3" />
                    <span>Neu</span>
                  </span>
                )}
                <span className="text-gray-400 text-sm mr-1">({event.location || 'Keine Ortsangabe'})</span>
                <span className="text-yellow-500 text-xs flex items-center">
                  <ThumbsUp className="w-3 h-3 mr-1" /> 
                  {/* Make sure to render the likes count as a number or string, not an object */}
                  {typeof event.likes === 'number' ? event.likes : 0}
                </span>
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
            animation: ticker 120s linear infinite;
          }
          
          .ticker-paused {
            animation: ticker 120s linear infinite;
            animation-play-state: paused;
          }
        `}
      </style>
    </div>
  );
};

export default LiveTicker;
