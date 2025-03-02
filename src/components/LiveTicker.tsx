
import React, { useEffect, useState, useRef } from 'react';
import { Calendar, RefreshCw, ArrowRight } from 'lucide-react';
import { format, parseISO, isAfter, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { type Event } from './EventCalendar';

interface LiveTickerProps {
  events: Event[];
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events }) => {
  const [newEvents, setNewEvents] = useState<Event[]>([]);
  const [isScrolling, setIsScrolling] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Get recent events (added in the last 3 days)
  useEffect(() => {
    // Consider events from the last 3 days as "new"
    const threeDaysAgo = subDays(new Date(), 3);
    
    // Sort events by date (newest first)
    const recent = events
      .filter(event => {
        // Use the event's date for filtering
        const eventDate = parseISO(event.date);
        return isAfter(eventDate, threeDaysAgo);
      })
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      })
      .slice(0, 10); // Limit to 10 events for better performance
    
    setNewEvents(recent);
  }, [events]);

  // Smooth scrolling animation for the ticker
  useEffect(() => {
    if (!tickerRef.current || newEvents.length === 0) return;
    
    let animationId: number;
    let position = 0;
    const speed = 1; // pixels per frame
    const tickerWidth = tickerRef.current.scrollWidth;
    const containerWidth = tickerRef.current.parentElement?.clientWidth || 0;
    
    const animate = () => {
      if (!tickerRef.current || !isScrolling) return;
      
      position = (position + speed) % tickerWidth;
      tickerRef.current.style.transform = `translateX(-${position}px)`;
      
      // Reset position when we've scrolled past the first item
      if (position > tickerWidth - containerWidth) {
        // Instead of resetting abruptly, we'll append a copy to create a seamless loop
        // This is handled by the JSX with the doubled content
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [newEvents, isScrolling]);

  // Pause scrolling when hovering
  const handleMouseEnter = () => setIsScrolling(false);
  const handleMouseLeave = () => setIsScrolling(true);

  if (newEvents.length === 0) {
    return null; // Don't render if no new events
  }

  return (
    <div 
      className="bg-black text-white overflow-hidden py-2 relative animate-fade-in"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ticker header */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 bg-red-600 px-3 py-2">
        <Calendar className="w-4 h-4 mr-1" />
        <span className="font-bold text-sm whitespace-nowrap">Neue Events</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
      
      {/* Gradient fade effect on edges */}
      <div className="absolute left-[100px] top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
      
      {/* Scrolling content */}
      <div className="ml-[120px] mr-2"> {/* Add margin to make space for the header */}
        <div 
          ref={tickerRef} 
          className="whitespace-nowrap inline-block"
        >
          {/* We duplicate the items to create an infinite scroll effect */}
          {[...newEvents, ...newEvents].map((event, index) => (
            <div 
              key={`${event.id}-${index}`} 
              className="inline-block mx-4"
            >
              <span className="inline-flex items-center">
                <span className="text-red-500 font-semibold mr-1">
                  {format(parseISO(event.date), 'dd.MM', { locale: de })}:
                </span>
                <span className="text-white mr-1">{event.title}</span>
                <span className="text-gray-400 text-sm">({event.location})</span>
              </span>
              <span className="mx-3 text-red-500">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;
