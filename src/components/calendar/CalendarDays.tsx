
import React from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/eventTypes';
import { parseAndNormalizeDate } from '@/utils/dateUtils';
import { getEventCountForDay, hasEventsOnDay } from '@/utils/eventUtils';

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
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {daysInMonth.map((day) => {
          const isCurrentDay = isToday(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayHasEvents = hasEventsOnDay(events, day);
          const eventCount = getEventCountForDay(events, day);
          
          return (
            <button
              key={day.toISOString()}
              className={cn(
                "aspect-square p-1 md:p-2 relative flex flex-col items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer",
                isCurrentDay && "border-red-500 border-2",
                isSelected && "bg-white/20",
                (isCurrentDay || isSelected) && "font-bold"
              )}
              onClick={() => onDateClick(day)}
            >
              <span className={cn(
                "text-sm md:text-base",
                isCurrentDay ? "text-red-500" : "text-white"
              )}>
                {format(day, 'd')}
              </span>
              
              {dayHasEvents && (
                <span className={cn(
                  "flex items-center justify-center text-[10px] font-bold rounded-full w-4 h-4 mt-1",
                  isSelected ? "bg-white text-black" : "bg-red-500 text-white"
                )}>
                  {eventCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default CalendarDays;
