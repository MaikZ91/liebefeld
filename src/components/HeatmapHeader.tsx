import React, { useState } from 'react';
import ChatInput from './event-chat/ChatInput';
import CitySelector from './layouts/CitySelector';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { X, ChevronRight } from 'lucide-react';
import { useEventContext, cities } from '@/contexts/EventContext';

interface HeatmapHeaderProps {
  selectedCity?: string;
  chatInputProps?: {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: (input?: string) => Promise<void>;
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
  chatInputProps, 
  onMIAOpenChange,
  hasNewDailyRecommendation = false,
  onMIAClick,
  isDailyRecommendationLoading = false
}) => {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const { selectedCity } = useEventContext();
  const miaAvatarUrl = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

  const categories = ['Art', 'Comedy', 'Jazz', 'Meetups'];
  
  // Get full city name from abbreviation
  const displayCity = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity;

  const handleMiaIconClick = () => {
    if (hasNewDailyRecommendation && onMIAClick) {
      onMIAClick();
    } else {
      setShowSearchBar(true);
      onMIAOpenChange?.(true);
      setTimeout(() => {
        chatInputProps?.inputRef?.current?.focus();
      }, 100);
    }
  };

  const handleCloseSearchBar = () => {
    setShowSearchBar(false);
    onMIAOpenChange?.(false);
    chatInputProps?.setInput('');
  };

  const handleCategoryClick = (category: string) => {
    if (chatInputProps) {
      const prompt = `Zeige mir Events für ${category}`;
      chatInputProps.setInput(prompt);
      chatInputProps.handleSendMessage(prompt);
    }
  };

  return (
    <div className="pt-4 px-4">
      {/* Compact horizontal scrollable header */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2">
        {/* City Selector */}
        <div className="shrink-0">
          <CitySelector />
        </div>

        {/* Tonight in [City] */}
        <span className="text-white/60 text-sm font-light whitespace-nowrap shrink-0">
          Tonight in {displayCity}
        </span>
        
        {/* Categories */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className="text-white/80 hover:text-white text-sm font-light whitespace-nowrap transition-colors shrink-0"
          >
            {category}
          </button>
        ))}

        {/* Scroll indicator */}
        <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />

        {/* MIA KI - positioned at the end */}
        <button
          onClick={handleMiaIconClick}
          disabled={isDailyRecommendationLoading}
          className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50 ml-auto shrink-0"
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={miaAvatarUrl} alt="MIA" />
          </Avatar>
          <span className="text-white text-xs font-medium">
            {isDailyRecommendationLoading ? '...' : 'MIA'}
          </span>
          
          {/* Notification badge */}
          {hasNewDailyRecommendation && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>
      
      {/* Search bar overlay when MIA is clicked */}
      {showSearchBar && chatInputProps && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex-1">
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
                showAnimatedPrompts={chatInputProps.showAnimatedPrompts}
                activeChatModeValue={chatInputProps.activeChatModeValue}
                placeholder="Frag MIA nach Events..."
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseSearchBar}
              className="text-white hover:bg-white/10 shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapHeader;
