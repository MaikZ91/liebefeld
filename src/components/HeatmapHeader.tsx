// src/components/HeatmapHeader.tsx
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
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isHeartActive: boolean;
    handleHeartClick: () => void;
    globalQueries: any[];
    toggleRecentQueries: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onAddEvent?: () => void;
    showAnimatedPrompts: boolean;
    activeChatModeValue: 'ai' | 'community';
    activeCategory?: string;
    onCategoryChange?: (category: string) => void;
  };
}

const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({ selectedCity = 'bielefeld', chatInputProps }) => {
  const { events, isLoading } = useEvents();

  return (
    <div className="absolute top-0 left-0 right-0 z-[1002] bg-black/90 backdrop-blur-sm border-b border-gray-800">
      {/* Live Ticker at the very top */}
      <LiveTicker 
        events={events} 
        isLoadingEvents={isLoading}
        selectedCity={selectedCity}
      />
      
      {/* Top bar with THE TRIBE logo, City Selector, and Chat Input */}
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side: THE TRIBE + City Selector */}
        <div className="flex flex-col items-start flex-shrink-0">
          <Link to="/" className="flex items-center">
            <h1 className="font-sans text-2xl font-bold tracking-tight text-white">THE TRIBE</h1>
          </Link>
          <CitySelector />
        </div>
        
        {/* Right side: Chat Input (always AI mode for this header input) */}
        {chatInputProps && (
          <div className="flex-1 min-w-0 ml-4 max-w-md"> {/* Added ml-4 for spacing */}
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
              activeChatModeValue="ai" // Fixed to "ai" for this header input
              placeholder="Frage nach Events..." // Custom placeholder
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatmapHeader;