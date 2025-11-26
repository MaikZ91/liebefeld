import React, { useState, useRef, useMemo } from 'react';
import { ThumbsUp } from 'lucide-react';
import { format, parseISO, startOfDay, addDays, isWithinInterval, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface TickerEvent {
  id: string;
  date: string;
  title: string;
  location?: string;
  likes?: number;
}

interface TribeLiveTickerProps {
  events: TickerEvent[];
  selectedCity?: string;
  onEventClick?: (eventId: string) => void;
}

export const TribeLiveTicker: React.FC<TribeLiveTickerProps> = ({ events, selectedCity, onEventClick }) => {
  const [isPaused, setIsPaused] = useState(false);
  const innerTickerRef = useRef<HTMLDivElement>(null);

  const tickerEvents = useMemo(() => {
    if (events.length === 0) return [];

    const today = startOfDay(new Date());
    const thirtyDaysFromTodayInclusiveEnd = endOfDay(addDays(today, 29));

    const next30DaysEvents = events.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parseISO(event.date);
        return isWithinInterval(eventDate, { start: today, end: thirtyDaysFromTodayInclusiveEnd });
      } catch (e) {
        return false;
      }
    });

    return next30DaysEvents.sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;

      if (likesB !== likesA) {
        return likesB - likesA;
      }

      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
  }, [events]);

  return (
    <div className="relative">
      <div 
        className="text-white overflow-hidden py-1 relative bg-black border-b border-white/5"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-[5] pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-[5] pointer-events-none"></div>
        
        <div className="ml-0 mr-0 overflow-hidden">
          <div 
            ref={innerTickerRef}
            className={`whitespace-nowrap inline-block ${isPaused ? 'ticker-paused' : 'ticker-scroll'}`}
          >
            {tickerEvents.length > 0 ? (
              <>
                {[...tickerEvents, ...tickerEvents].map((event, index) => (
                  <button
                    key={`${event.id}-${index}`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event.id);
                    }}
                    className="inline-block mx-4 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-gold font-bold text-[11px] tracking-wide">
                        {(() => {
                          try {
                            const date = parseISO(event.date);
                            return format(date, 'dd.MM', { locale: de });
                          } catch {
                            return 'TBA';
                          }
                        })()}
                      </span>
                      <span className="text-white text-[11px] font-medium">{event.title}</span>
                      <span className="text-zinc-500 text-[10px]">({event.location || 'TBA'})</span>
                      <span className="text-gold/70 text-[10px] flex items-center gap-0.5">
                        <ThumbsUp className="w-2.5 h-2.5" /> 
                        {event.likes || 0}
                      </span>
                    </span>
                    <span className="mx-3 text-gold/30">•</span>
                  </button>
                ))}
              </>
            ) : (
              <span className="inline-block mx-4 text-zinc-600 text-[11px]">
                No upcoming events in {selectedCity || 'your city'}
              </span>
            )}
          </div>
        </div>
        
        <style>{`
          @keyframes ticker {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .ticker-scroll {
            animation: ticker 480s linear infinite;
          }
          .ticker-paused {
            animation-play-state: paused;
          }
        `}</style>
      </div>
      
      {/* Gold Pulse Line */}
      <div className="w-full h-[1px] bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent animate-pulse"></div>
      </div>
    </div>
  );
};
