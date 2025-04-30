
import React, { useRef, useEffect } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/eventTypes';
import { parseAndNormalizeDate } from '@/utils/dateUtils';
import { getEventCountForDay, hasEventsOnDay, isTribeEvent } from '@/utils/eventUtils';

interface CalendarDaysProps {
  daysInMonth: Date[];
  events: Event[];
  selectedDate: Date | null;
  onDateClick: (day: Date) => void;
}

const CalendarDays: React.FC<CalendarDaysProps> = ({
  daysInMonth,
  events,
  selectedDate,
  onDateClick
}) => {
  // Create a ref for the current day element
  const todayRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to today's element when component mounts, but wait for animations to complete
  useEffect(() => {
    if (todayRef.current && containerRef.current) {
      // Wait longer to ensure all animations are completed before scrolling
      const scrollTimer = setTimeout(() => {
        // Calculate positioning to center the current day in the grid view
        const container = containerRef.current;
        const todayElement = todayRef.current;
        
        if (!container || !todayElement) return;
        
        // Calculate the position to center today's date
        const containerRect = container.getBoundingClientRect();
        const todayRect = todayElement.getBoundingClientRect();
        const scrollLeft = todayElement.offsetLeft - containerRect.width / 2 + todayRect.width / 2;
        
        // Use smooth scrolling for better user experience
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
        
        console.log('Scrolled calendar to today after animations completed');
      }, 5500); // Wait 5.5 seconds to ensure all animations are done
      
      return () => clearTimeout(scrollTimer);
    }
  }, []);
  
  return (
    <>
      {/* Day names header */}
      <div className="grid grid-cols-7 mb-4">
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days - add horizontal scrolling */}
      <div 
        ref={containerRef}
        className="overflow-x-auto pb-2 mb-2 scrollbar-hide"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none'  /* IE and Edge */
        }}
      >
        <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-full">
          {daysInMonth.map((day) => {
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const dayHasEvents = hasEventsOnDay(events, day);
            const eventCount = getEventCountForDay(events, day);
            const dayHasTribeEvents = events.some(event => {
              try {
                if (!event.date) return false;
                const eventDate = parseAndNormalizeDate(event.date);
                return isSameDay(eventDate, day) && isTribeEvent(event.title);
              } catch (error) {
                console.error(`Error in checking tribe events for ${day.toISOString()}:`, error);
                return false;
              }
            });
            
            return (
              <button
                key={day.toISOString()}
                ref={isCurrentDay ? todayRef : null}
                className={cn(
                  "aspect-square p-1 md:p-2 relative flex flex-col items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer",
                  isCurrentDay && "border-red-500 border-2",
                  isSelected && "bg-white/20",
                  dayHasTribeEvents && !isSelected && "bg-purple-900/20",
                  (isCurrentDay || isSelected) && "font-bold"
                )}
                onClick={() => onDateClick(day)}
              >
                <span className={cn(
                  "text-sm md:text-base",
                  isCurrentDay ? "text-red-500" : (dayHasTribeEvents ? "text-purple-300" : "text-white")
                )}>
                  {format(day, 'd')}
                </span>
                
                {dayHasEvents && (
                  <span className={cn(
                    "flex items-center justify-center text-[10px] font-bold rounded-full w-4 h-4 mt-1",
                    isSelected ? "bg-white text-black" : 
                      dayHasTribeEvents ? "bg-purple-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {eventCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </>
  );
};

export default CalendarDays;
