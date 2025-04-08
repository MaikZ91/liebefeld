
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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0.5 mb-0">
      <div className="flex items-center justify-between md:justify-start">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevMonth} 
          className="rounded-full hover:scale-105 transition-transform bg-red-500 text-black border-red-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl md:text-2xl font-medium w-48 text-center text-black">
          {showFavorites 
            ? "Meine Favoriten" 
            : showNewEvents 
              ? "Neue Events" 
              : format(currentDate, 'MMMM yyyy', { locale: de })
          }
        </h2>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextMonth} 
          className="rounded-full hover:scale-105 transition-transform bg-red-500 text-black border-red-600"
          disabled={showFavorites || showNewEvents}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-0.5">
        <div className="flex items-center gap-0.5 overflow-x-auto pb-0 scrollbar-none">
          {/* Add Event button - NEW POSITION */}
          <Button 
            className="rounded-full whitespace-nowrap flex items-center gap-2 bg-black/70 text-white border-gray-700 hover:bg-black/60 hover:text-white dark-button"
            onClick={onShowEventForm}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showEventForm ? "Schließen" : "Neu"}
            </span>
          </Button>
          
          {/* View toggle dropdown */}
          <DropdownMenu open={isViewDropdownOpen} onOpenChange={setIsViewDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                className={cn(
                  "rounded-full whitespace-nowrap flex items-center gap-2",
                  "bg-black/70 text-white border-gray-700 hover:bg-black/60 hover:text-white dark-button"
                )}
              >
                {view === "list" ? <List className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {view === "list" ? "Liste" : "Kalender"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-black/90 border-gray-700 text-white rounded-xl p-2 shadow-xl min-w-48 z-50"
              align="center"
            >
              <DropdownMenuLabel className="text-center text-gray-300">Ansicht</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuCheckboxItem
                checked={view === "list"}
                onSelect={(e) => {
                  e.preventDefault();
                  setView("list");
                  setIsViewDropdownOpen(false);
                }}
                className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
              >
                <List className="h-4 w-4 mr-1" />
                Liste
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={view === "calendar"}
                onSelect={(e) => {
                  e.preventDefault();
                  setView("calendar");
                  setIsViewDropdownOpen(false);
                }}
                className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Kalender
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Favorites button positioned at the beginning of the filter list */}
          <Button 
            className={cn(
              "flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all",
              showFavorites ? "bg-red-500 text-white hover:bg-red-600" : "bg-black text-red-500 border-red-500 hover:bg-black/90 hover:text-red-500"
            )}
            onClick={toggleFavorites}
          >
            <Heart className={cn("h-4 w-4", showFavorites ? "fill-white" : "")} />
            <span className="hidden sm:inline">
              {showFavorites ? "Alle" : "Favoriten"}
            </span>
            {!showFavorites && favoriteEvents > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {favoriteEvents}
              </span>
            )}
          </Button>
          
          {/* New events button with NEW text */}
          <Button 
            className={cn(
              "flex items-center space-x-2 rounded-full shadow-md hover:shadow-lg transition-all",
              showNewEvents ? "bg-green-600 text-white hover:bg-green-700" : "bg-black text-green-500 border-green-500 hover:bg-black/90 hover:text-green-500"
            )}
            onClick={toggleNewEvents}
          >
            <span className="font-bold">NEW</span>
            {!showNewEvents && newEventsCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
                {newEventsCount}
              </span>
            )}
          </Button>
          
          {/* Category filter dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                className={cn(
                  "rounded-full whitespace-nowrap flex items-center gap-2",
                  filter ? "bg-red-500 text-white hover:bg-red-600" : 
                  "bg-black/70 text-white border-gray-700 hover:bg-black/60 hover:text-white dark-button"
                )}
              >
                {filter ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {filter || "Kategorien"}
                </span>
                {filter && (
                  <div className="ml-1 flex items-center">
                    {categoryIcons[filter] && categoryIcons[filter]}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-black/90 border-gray-700 text-white rounded-xl p-2 shadow-xl min-w-48 z-50"
              align="center"
            >
              <DropdownMenuLabel className="text-center text-gray-300">Veranstaltungstyp</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              
              {/* Add "All" option at the top if a filter is active */}
              {filter && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onSelect={(e) => {
                      e.preventDefault();
                      clearFilter();
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4 mr-1" />
                    Alle anzeigen
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                </>
              )}
              
              {categories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filter === category}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleFilter(category);
                    setIsDropdownOpen(false);
                  }}
                  className="cursor-pointer hover:bg-gray-800 rounded-lg flex items-center gap-2"
                >
                  {category in categoryIcons ? categoryIcons[category] : null}
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
