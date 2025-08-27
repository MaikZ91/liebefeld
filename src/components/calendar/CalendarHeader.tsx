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

      {/* Controls row - Single Settings Dropdown */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="rounded-full whitespace-nowrap flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Einstellungen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="bg-black/90 border-gray-700 text-white rounded-xl p-2 shadow-xl min-w-48 z-50"
            align="center"
          >
            <DropdownMenuLabel className="text-center text-gray-300">Ansicht</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            
            {/* View toggle */}
            <DropdownMenuCheckboxItem
              checked={view === 'list'}
              onSelect={(e) => {
                e.preventDefault();
                setView('list');
              }}
              className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
            >
              <List className="h-4 w-4 mr-1" />
              Liste
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={view === 'calendar'}
              onSelect={(e) => {
                e.preventDefault();
                setView('calendar');
              }}
              className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Kalender
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuLabel className="text-center text-gray-300">Filter</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />

            {/* Favorites */}
            <DropdownMenuCheckboxItem
              checked={showFavorites}
              onSelect={(e) => {
                e.preventDefault();
                toggleFavorites();
              }}
              className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
            >
              <Heart className={cn('h-4 w-4 mr-1', showFavorites ? 'fill-white' : '')} />
              Top Events
              {favoriteEvents > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {favoriteEvents}
                </span>
              )}
            </DropdownMenuCheckboxItem>

            {/* New Events */}
            <DropdownMenuCheckboxItem
              checked={showNewEvents}
              onSelect={(e) => {
                e.preventDefault();
                toggleNewEvents();
              }}
              className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
            >
              <span className="font-bold mr-1">NEW</span>
              Neue Events
              {newEventsCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-green-600 rounded-full">
                  {newEventsCount}
                </span>
              )}
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuLabel className="text-center text-gray-300">Kategorien</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />

            {/* Clear filter option */}
            {filter && (
              <DropdownMenuCheckboxItem
                checked={false}
                onSelect={(e) => {
                  e.preventDefault();
                  clearFilter();
                }}
                className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
              >
                <FilterX className="h-4 w-4 mr-1" />
                Alle anzeigen
              </DropdownMenuCheckboxItem>
            )}

            {/* Category filters */}
            {categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={filter === category}
                onSelect={(e) => {
                  e.preventDefault();
                  toggleFilter(category);
                }}
                className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
              >
                {category in categoryIcons ? categoryIcons[category] : null}
                {category}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator className="bg-gray-700" />
            
            {/* Add Event */}
            <DropdownMenuCheckboxItem
              checked={false}
              onSelect={(e) => {
                e.preventDefault();
                onShowEventForm();
              }}
              className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              {showEventForm ? 'Event-Form schließen' : 'Neues Event erstellen'}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default CalendarHeader;
