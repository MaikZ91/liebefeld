
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Calendar, ThumbsUp } from 'lucide-react';
import { format, parseISO, isSameMonth, startOfDay, isAfter, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from '../types/eventTypes';

interface LiveTickerProps {
  events: Event[];
  tickerRef?: React.RefObject<HTMLDivElement>;
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events, tickerRef }) => {
  // useMemo: Filter + Sort Logik nur wenn events sich wirklich ändern
  const tickerEvents = useMemo(() => {
    if (events.length === 0) return [];

    const currentDate = new Date();
    const today = startOfDay(new Date());

    const currentMonthEvents = events.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parseISO(event.date);
        return isSameMonth(eventDate, currentDate) && (isAfter(eventDate, today) || isToday(eventDate));
      } catch {
        return false;
      }
    });

    const eventsByDay: Record<string, Event[]> = {};
    currentMonthEvents.forEach(event => {
      if (!event.date) return;
      try {
        const eventDate = parseISO(event.date);
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        if (!eventsByDay[dateKey]) eventsByDay[dateKey] = [];
        eventsByDay[dateKey].push(event);
      } catch { /* ignore */ }
    });

    const topEventsByDay = Object.keys(eventsByDay).map(dateKey => {
      const dayEvents = eventsByDay[dateKey];
      return dayEvents.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
    });

    return topEventsByDay.sort((a, b) => {
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
  }, [events]);
  
  // Animation pause für hover
  const [isPaused, setIsPaused] = useState(false);
  const innerTickerRef = useRef<HTMLDivElement>(null);

  // Entferne alle unkritischen Logging-Statements (nur noch Fehler im Fehlerfall)
  // -> Kein console.log für "Processing X events"/"Found Y events" mehr

  if (!tickerEvents.length) {
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
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
        
        <div className="ml-0 mr-0 overflow-hidden">
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
                      } catch {
                        return 'Datum?';
                      }
                    })()}:
                  </span>
                  <span className="text-white mr-1 text-sm">{event.title}</span>
                  <span className="text-gray-400 text-xs mr-1">({event.location || 'Keine Ortsangabe'})</span>
                  <span className="text-yellow-500 text-xs flex items-center">
                    <ThumbsUp className="w-3 h-3 mr-0.5" /> 
                    {event.likes || 0}
                  </span>
                  {event.source === 'github' && (
                    <span className="text-blue-400 text-xs ml-1">[GitHub]</span>
                  )}
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
