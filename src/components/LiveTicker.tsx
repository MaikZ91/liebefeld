// src/components/LiveTicker.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ArrowRight, ThumbsUp } from 'lucide-react';
import { format, parseISO, isSameMonth, startOfDay, isAfter, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from '../types/eventTypes';

interface LiveTickerProps {
  events: Event[];
  tickerRef?: React.RefObject<HTMLDivElement>;
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events, tickerRef }) => {
  const [tickerEvents, setTickerEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const innerTickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (events.length === 0) return;
    
    try {
      console.log(`LiveTicker: Processing ${events.length} events for ticker`);
      
      const currentDate = new Date();
      const today = startOfDay(new Date());
      
      const currentMonthEvents = events.filter(event => {
        try {
          if (!event.date) return false;
          const eventDate = parseISO(event.date);
          
          return isSameMonth(eventDate, currentDate) && (isAfter(eventDate, today) || isToday(eventDate));
        } catch (error) {
          console.error(`Error filtering for current month: ${event.date}`, error);
          return false;
        }
      });
      
      console.log(`LiveTicker: Found ${currentMonthEvents.length} events for current month`);
      
      const eventsByDay: Record<string, Event[]> = {};
      
      currentMonthEvents.forEach(event => {
        try {
          if (!event.date) return;
          
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
      
      const topEventsByDay = Object.keys(eventsByDay).map(dateKey => {
        const dayEvents = eventsByDay[dateKey];
        
        return dayEvents.sort((a, b) => {
          const likesA = a.likes || 0;
          const likesB = b.likes || 0;
          return likesB - likesA;
        })[0];
      });
      
      console.log(`LiveTicker: Found ${topEventsByDay.length} top events for the current month`);
      
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

  if (!tickerEvents.length) {
    console.log('LiveTicker: No top events to display');
    return null;
  }

  return (
    <div className="relative">
      <div 
        className="text-white overflow-hidden py-0.5 relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        ref={tickerRef}
      >
        <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 bg-red-600 px-2 py-0.5">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        
        <div className="absolute left-[60px] top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
        
        <div className="ml-[60px] mr-2 overflow-hidden">
          <div 
            ref={innerTickerRef}
            className={`whitespace-nowrap inline-block ${isPaused ? 'ticker-paused' : 'ticker-scroll'}`}
          >
            {[...tickerEvents, ...tickerEvents].map((event, index) => (
              <div 
                key={`${event.id}-${index}`} 
                className="inline-block mx-3"
              >
                <span className="inline-flex items-center">
                  <span className="text-red-500 font-semibold mr-1 text-sm">
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
                  <span className="text-white mr-1 text-sm">{event.title}</span>
                  <span className="text-gray-400 text-xs mr-1">({event.location || 'Keine Ortsangabe'})</span>
                  <span className="text-yellow-500 text-xs flex items-center">
                    <ThumbsUp className="w-3 h-3 mr-0.5" /> 
                    {typeof event.likes === 'number' ? event.likes : 0}
                  </span>
                </span>
                <span className="mx-2 text-red-500">•</span>
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
      
      {/* Animated red line below ticker */}
      <div className="w-full h-0.5 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 h-full w-8 bg-red-500 animate-bounce"></div>
        <style>
          {`
            @keyframes slide {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100vw);
              }
            }
            
            .animate-slide {
              animation: slide 3s linear infinite;
            }
          `}
        </style>
        <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-red-600 to-red-400 animate-slide"></div>
      </div>
    </div>
  );
};

export default LiveTicker;