
import React, { useEffect, useState, useRef } from 'react';
import { Calendar, RefreshCw, ArrowRight } from 'lucide-react';
import { format, parseISO, isAfter, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { type Event } from './EventCalendar';

interface LiveTickerProps {
  events: Event[];
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events }) => {
  const [weeklyEvents, setWeeklyEvents] = useState<Event[]>([]);
  const [isScrolling, setIsScrolling] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Get events for the current week
  useEffect(() => {
    // Get start and end of current week (Monday to Sunday)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
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
          // Sort by date ascending (earliest first)
          return parseISO(a.date).getTime() - parseISO(b.date).getTime();
        } catch (error) {
          console.error(`Error sorting dates: ${a.date}, ${b.date}`, error);
          return 0;
        }
      })
      .slice(0, 10); // Limit to 10 events for better performance
    
    setWeeklyEvents(eventsThisWeek);
    
    // Debug info
    console.log(`LiveTicker: Found ${eventsThisWeek.length} events this week out of ${events.length} total events`);
    console.log(`Week range: ${format(weekStart, 'dd.MM.')} - ${format(weekEnd, 'dd.MM.')}`);
  }, [events]);

  // Set up the animation using CSS animation instead of JS
  useEffect(() => {
    if (!tickerRef.current || weeklyEvents.length === 0) return;
    
    const ticker = tickerRef.current;
    
    // Measure ticker content width to set animation distance
    const contentWidth = ticker.scrollWidth;
    const containerWidth = ticker.parentElement?.clientWidth || 300;
    
    // Only animate if content is wider than container
    if (contentWidth > containerWidth && isScrolling) {
      // Create keyframe animation dynamically based on content width
      const animationDuration = contentWidth / 50; // Speed factor - higher divisor = faster
      
      // Apply animation styles
      ticker.style.animationDuration = `${animationDuration}s`;
      ticker.style.animationTimingFunction = 'linear';
      ticker.style.animationIterationCount = 'infinite';
      ticker.style.animationName = 'tickerMove';
      ticker.style.animationPlayState = 'running';
    } else {
      // Stop animation if paused or content fits
      ticker.style.animationPlayState = 'paused';
    }
    
    return () => {
      if (ticker) {
        ticker.style.animationName = 'none';
      }
    };
  }, [weeklyEvents, isScrolling]);

  // Pause scrolling when hovering
  const handleMouseEnter = () => setIsScrolling(false);
  const handleMouseLeave = () => setIsScrolling(true);

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
      <div className="ml-[120px] mr-2 overflow-hidden">
        <div 
          ref={tickerRef} 
          className="whitespace-nowrap inline-block animate-tickerMove"
          style={{
            transform: 'translateX(0)',
            animationName: 'tickerMove'
          }}
        >
          {/* We duplicate the items to create an infinite scroll effect */}
          {[...eventsToShow, ...eventsToShow].map((event, index) => (
            <div 
              key={`${event.id}-${index}`} 
              className="inline-block mx-4"
            >
              <span className="inline-flex items-center">
                <span className="text-red-500 font-semibold mr-1">
                  {(() => {
                    try {
                      // Try to parse the ISO date
                      const date = parseISO(event.date);
                      return format(date, 'dd.MM', { locale: de });
                    } catch (error) {
                      console.error(`Failed to format date: ${event.date}`, error);
                      // Fallback format if parsing fails
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
      
      {/* CSS for the animation - Fixed the style tag by removing jsx attribute */}
      <style>{`
        @keyframes tickerMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveTicker;
