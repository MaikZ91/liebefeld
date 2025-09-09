import React, { useState } from 'react';
import LiveTicker from './LiveTicker';
import { useEvents } from '@/hooks/useEvents';
import CitySelector from './layouts/CitySelector'; // Import CitySelector
import ChatInput from './event-chat/ChatInput'; // Import ChatInput
import { Link } from 'react-router-dom'; // Import Link for THE TRIBE text
import { Button } from '@/components/ui/button';
import { Bot, X } from 'lucide-react';

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
}

const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({ selectedCity = 'bielefeld', chatInputProps }) => {
  const { events, isLoading } = useEvents(selectedCity);
  const [showSearchBar, setShowSearchBar] = useState(false);

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
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <h1 className="font-sans text-2xl font-bold tracking-tight text-red-500">THE TRIBE</h1>
              </Link>
              <CitySelector />
            </div>
            
            {/* MIA Icon - only show if chatInputProps exist and search bar is not shown */}
            {chatInputProps && !showSearchBar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMiaIconClick}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 flex items-center gap-2"
              >
                <Bot className="h-5 w-5" />
                <span className="text-sm font-medium">MIA</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search bar - only show when showSearchBar is true */}
      {chatInputProps && showSearchBar && (
        <div className="px-4 pb-4 pt-2">
          <div className="bg-black rounded-full mx-2 relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseSearchBar}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white hover:bg-white/10 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </Button>
            
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
              activeChatModeValue="ai"
              placeholder="Frage MIA nach Events..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapHeader;