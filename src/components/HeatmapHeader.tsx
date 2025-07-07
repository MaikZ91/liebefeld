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
    <div className="absolute top-0 left-0 right-0 z-[1002]">
      {/* Live Ticker at the very top */}
      <LiveTicker 
        events={events} 
        isLoadingEvents={isLoading}
        selectedCity={selectedCity}
      />
      
      {/* Curved black header bar with THE TRIBE logo */}
      <div className="relative">
        {/* Main header with rounded corners */}
        <div className="bg-black rounded-b-[2rem] mx-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <h1 className="font-sans text-2xl font-bold tracking-tight text-red-500">THE TRIBE</h1>
            </Link>
            <CitySelector />
          </div>
        </div>
      </div>
      
      {/* Black search bar for AI Chat Input */}
      {chatInputProps && (
        <div className="px-4 -mt-2 pb-4">
          <div className="bg-black rounded-full border border-gray-700/50 mx-2">
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
              placeholder="Frage nach Events..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapHeader;