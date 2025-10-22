import React, { useState } from 'react';
import LiveTicker from './LiveTicker';
import { useEvents } from '@/hooks/useEvents';
import CitySelector from './layouts/CitySelector'; // Import CitySelector
import ChatInput from './event-chat/ChatInput'; // Import ChatInput
import { Link } from 'react-router-dom'; // Import Link for THE TRIBE text
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Filter, FilterX, Heart } from 'lucide-react';
import TypewriterPrompts from './TypewriterPrompts';

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
}

const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({ 
  selectedCity = 'bielefeld', 
  chatInputProps, 
  showFilterPanel = false,
  onToggleFilterPanel,
  onOpenSwipeMode 
}) => {
  const { events, isLoading } = useEvents(selectedCity);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const miaAvatarUrl = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

  const handleMiaIconClick = () => {
    setShowSearchBar(true);
    // Focus the input after it appears
    setTimeout(() => {
      chatInputProps?.inputRef?.current?.focus();
    }, 100);
  };

  const handleCloseSearchBar = () => {
    setShowSearchBar(false);
    // Clear input when closing
    chatInputProps?.setInput('');
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
                className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-full px-2.5 py-1.5 h-8 flex items-center gap-1.5 shrink-0 shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-all hover:scale-105"
              >
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md"></div>
                <Avatar className="h-5 w-5 relative z-10 ring-2 ring-white/20">
                  <AvatarImage src={miaAvatarUrl} alt="MIA" />
                </Avatar>
                <span className="text-xs font-bold relative z-10">MIA</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Filter and Heart buttons - shown below header when MIA closed */}
      {!showSearchBar && (
        <div className="px-4 pb-2 pt-2 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-black/95 text-white border-gray-700 hover:bg-gray-800"
            onClick={onToggleFilterPanel}
            title={showFilterPanel ? "Filter ausblenden" : "Filter anzeigen"}
          >
            {showFilterPanel ? <FilterX className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-black/95 text-white border-gray-700 hover:bg-gray-800"
            onClick={onOpenSwipeMode}
            title="Event Swipe Modus"
          >
            <Heart className="h-5 w-5" />
          </Button>
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
          
          {/* Filter and Heart buttons - shown below chat input when MIA open */}
          <div className="px-4 pb-4 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-black/95 text-white border-gray-700 hover:bg-gray-800"
              onClick={onToggleFilterPanel}
              title={showFilterPanel ? "Filter ausblenden" : "Filter anzeigen"}
            >
              {showFilterPanel ? <FilterX className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-black/95 text-white border-gray-700 hover:bg-gray-800"
              onClick={onOpenSwipeMode}
              title="Event Swipe Modus"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default HeatmapHeader;