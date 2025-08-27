import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Heart, Filter, FilterX, CalendarIcon, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface CalendarHeaderProps {
  currentDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  showFavorites: boolean;
  toggleFavorites: () => void;
  favoriteEvents: number;
  filter: string | null;
  toggleFilter: (category: string) => void;
  categories: string[];
  categoryIcons: Record<string, React.ReactNode>;
  showNewEvents: boolean;
  toggleNewEvents: () => void;
  newEventsCount: number;
  view: "calendar" | "list";
  setView: (view: "calendar" | "list") => void;
  onShowEventForm: () => void;
  showEventForm: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  prevMonth,
  nextMonth,
  showFavorites,
  toggleFavorites,
  favoriteEvents,
  filter,
  toggleFilter,
  categories,
  categoryIcons,
  showNewEvents,
  toggleNewEvents,
  newEventsCount,
  view,
  setView,
  onShowEventForm,
  showEventForm
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // Function to clear the current filter
  const clearFilter = () => {
    if (filter) {
      toggleFilter(filter); // This will toggle off the current filter
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-2 py-2">
      {/* Top month navigation */}
      <div className="flex items-center justify-between md:justify-start">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevMonth} 
          className="rounded-full hover:scale-105 transition-transform bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl md:text-2xl font-medium w-48 text-center text-white">
          {showFavorites 
            ? "Meine Favoriten" 
            : showNewEvents 
              ? "Neue Events" 
              : format(currentDate, 'MMMM yyyy', { locale: de })}
        </h2>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextMonth} 
          className="rounded-full hover:scale-105 transition-transform bg-white/10 text-white border-white/20 hover:bg-white/20"
          disabled={showFavorites || showNewEvents}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
