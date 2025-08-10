import React from 'react';
import LiveTicker from './LiveTicker';
import { useEvents } from '@/hooks/useEvents';
import CitySelector from './layouts/CitySelector'; // Import CitySelector
import ChatInput from './event-chat/ChatInput'; // Import ChatInput
import { Link } from 'react-router-dom'; // Import Link for THE TRIBE text

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

  return (
    <div className="fixed top-0 left-0 right-0 z-[1002]">
      {/* Curved black header bar with THE TRIBE logo */}
      <div className="relative pt-2">
        {/* Main header with speech bubble shape - rounded all corners */}
        <div className="bg-transparent mx-4 px-6 py-4 relative rounded-[2rem]">
          {/* Main content */}
          <div className="flex items-center gap-4 relative z-10">
            <Link to="/" className="flex items-center">
              <h1 className="font-sans text-2xl font-bold tracking-tight text-red-500">THE TRIBE</h1>
            </Link>
            <CitySelector />
          </div>
        </div>
      </div>
      
      {/* Black search bar for AI Chat Input */}
      {chatInputProps && (
        <div className="px-4 pb-4 pt-2"> {/* Added pt-2 here */}
          <div className="bg-black rounded-full mx-2">
            
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