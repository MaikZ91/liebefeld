
import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  categoryIcons
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          {showFavorites ? "Meine Favoriten" : format(currentDate, 'MMMM yyyy', { locale: de })}
        </h2>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextMonth} 
          className="rounded-full hover:scale-105 transition-transform bg-red-500 text-black border-red-600"
          disabled={showFavorites}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
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
          
          {categories.map(category => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(category)}
              className={cn(
                "rounded-full whitespace-nowrap",
                (category === "Konzert" || category === "Party" || category === "Sonstiges") ?
                  (filter === category 
                    ? "bg-black text-red-500 border-red-500 hover:bg-black/90 hover:text-red-500" 
                    : "bg-black text-red-500 border-red-500 hover:bg-black/90 hover:text-red-500")
                  : (filter === category 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-black/70 text-white border-gray-700 hover:bg-black/60 hover:text-white dark-button")
              )}
            >
              {category in categoryIcons ? categoryIcons[category as keyof typeof categoryIcons] : null}
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
