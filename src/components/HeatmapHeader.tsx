import React, { useState } from 'react';
import LiveTicker from './LiveTicker';
import { useEvents } from '@/hooks/useEvents';
import CitySelector from './layouts/CitySelector'; // Import CitySelector
import ChatInput from './event-chat/ChatInput'; // Import ChatInput
import { Link } from 'react-router-dom'; // Import Link for THE TRIBE text
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Filter, FilterX, Heart, CalendarIcon } from 'lucide-react';
import TypewriterPrompts from './TypewriterPrompts';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HeatmapHeaderProps {
  selectedCity?: string;
  chatInputProps?: {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: (input?: string) => Promise<void>; // Updated signature to accept optional string
    isTyping: boolean;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    isHeartActive: boolean;
    handleHeartClick: () => void;
    globalQueries: any[];
    toggleRecentQueries: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    onAddEvent?: () => void;
    showAnimatedPrompts: boolean;
    activeChatModeValue: 'ai' | 'community';
    activeCategory?: string;
    onCategoryChange?: (category: string) => void;
  };
  showFilterPanel?: boolean;
  onToggleFilterPanel?: () => void;
  onOpenSwipeMode?: () => void;
  onMIAOpenChange?: (isOpen: boolean) => void;
  hasNewDailyRecommendation?: boolean;
  onMIAClick?: () => void;
  isDailyRecommendationLoading?: boolean;
}

const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({ 
  selectedCity = 'bielefeld', 
  chatInputProps, 
  showFilterPanel = false,
  onToggleFilterPanel,
  onOpenSwipeMode,
  onMIAOpenChange,
  hasNewDailyRecommendation = false,
  onMIAClick,
  isDailyRecommendationLoading = false
}) => {
  const { events, isLoading } = useEvents(selectedCity);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const miaAvatarUrl = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

  const handleMiaIconClick = () => {
    // If there's a daily recommendation, trigger the custom handler
    if (hasNewDailyRecommendation && onMIAClick) {
      onMIAClick();
    } else {
      setShowSearchBar(true);
      onMIAOpenChange?.(true);
      // Focus the input after it appears
      setTimeout(() => {
        chatInputProps?.inputRef?.current?.focus();
      }, 100);
    }
  };

  const handleCloseSearchBar = () => {
    setShowSearchBar(false);
    onMIAOpenChange?.(false);
    // Clear input when closing
    chatInputProps?.setInput('');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && chatInputProps) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
      const formattedDate = format(date, 'dd.MM.yyyy', { locale: de });
      const prompt = `Zeige mir alle Events vom ${formattedDate}`;
      chatInputProps.setInput(prompt);
      chatInputProps.handleSendMessage(prompt);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[1002]">
      {/* Curved black header bar with THE TRIBE logo */}
      <div className="relative pt-2">
        {/* Main header with speech bubble shape - rounded all corners */}
        <div className="bg-black mx-4 px-6 py-4 relative rounded-[2rem]">
          {/* Main content */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Link to="/" className="flex items-center shrink-0">
                <h1 className="font-sans text-lg md:text-2xl font-bold tracking-tight text-red-500 whitespace-nowrap">THE TRIBE</h1>
              </Link>
              <CitySelector />
            </div>
            
            {/* MIA Icon - only show if chatInputProps exist and search bar is not shown */}
            {chatInputProps && !showSearchBar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMiaIconClick}
                disabled={isDailyRecommendationLoading}
                className={cn(
                  "relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-full px-2.5 py-1.5 h-8 flex items-center gap-1.5 shrink-0 shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-all hover:scale-105",
                  hasNewDailyRecommendation && "animate-pulse"
                )}
              >
                {hasNewDailyRecommendation && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                )}
                {hasNewDailyRecommendation && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                )}
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md"></div>
                <Avatar className="h-5 w-5 relative z-10 ring-2 ring-white/20">
                  <AvatarImage src={miaAvatarUrl} alt="MIA" />
                </Avatar>
                <span className="text-xs font-bold relative z-10">
                  {isDailyRecommendationLoading ? '...' : 'MIA'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Buttons below header when MIA closed - Heart button removed */}
      {!showSearchBar && (
        <div className="px-4 pb-2 pt-2 flex gap-2">
          {/* Heart button temporarily removed */}
        </div>
      )}
      
      {/* Search bar and buttons when MIA is open */}
      {chatInputProps && showSearchBar && (
        <>
          <div className="px-4 pb-2 pt-2">
            <ChatInput
              input={chatInputProps.input}
              setInput={chatInputProps.setInput}
              handleSendMessage={chatInputProps.handleSendMessage}
              isTyping={chatInputProps.isTyping}
              onKeyDown={chatInputProps.onKeyDown}
              onChange={chatInputProps.onChange}
              isHeartActive={chatInputProps.isHeartActive}
              handleHeartClick={chatInputProps.handleHeartClick}
              globalQueries={chatInputProps.globalQueries}
              toggleRecentQueries={chatInputProps.toggleRecentQueries}
              inputRef={chatInputProps.inputRef}
              onAddEvent={chatInputProps.onAddEvent}
              showAnimatedPrompts={true}
              activeChatModeValue="ai"
            />
          </div>
          
          {/* Kategorie-Prompt-Chips unter der Eingabe */}
          <div className="px-4 pb-3 pt-1 flex gap-2 overflow-x-auto scrollbar-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                chatInputProps.setInput("Zeige mir Events für Ausgehen");
                chatInputProps.handleSendMessage("Zeige mir Events für Ausgehen");
              }}
              className="bg-black/80 text-white border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-full px-4 py-2 text-xs whitespace-nowrap transition-all"
            >
              🎉 Ausgehen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                chatInputProps.setInput("Zeige mir Events für Sport");
                chatInputProps.handleSendMessage("Zeige mir Events für Sport");
              }}
              className="bg-black/80 text-white border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-full px-4 py-2 text-xs whitespace-nowrap transition-all"
            >
              ⚽ Sport
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                chatInputProps.setInput("Zeige mir Events für Kreativität");
                chatInputProps.handleSendMessage("Zeige mir Events für Kreativität");
              }}
              className="bg-black/80 text-white border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-full px-4 py-2 text-xs whitespace-nowrap transition-all"
            >
              🎨 Kreativität
            </Button>
            
            {/* Kalender-Picker Button */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/80 text-white border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-full px-4 py-2 text-xs whitespace-nowrap transition-all"
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                  Datum wählen
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-red-500/20" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={de}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Heart button removed when MIA open */}
          <div className="px-4 pb-4 flex gap-2">
            {/* Heart button temporarily removed */}
          </div>
        </>
      )}
    </div>
  );
};

export default HeatmapHeader;