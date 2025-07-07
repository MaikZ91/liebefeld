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
        {/* Main header with speech bubble shape */}
        <div className="bg-black mx-4 px-6 py-4 relative">
          {/* Rounded top corners */}
          <div className="absolute -top-4 left-4 w-8 h-8 bg-black rounded-tl-[2rem]"></div>
          <div className="absolute -top-4 right-4 w-8 h-8 bg-black rounded-tr-[2rem]"></div>
          
          {/* Main content */}
          <div className="flex items-center gap-4 relative z-10">
            <Link to="/" className="flex items-center">
              <h1 className="font-sans text-2xl font-bold tracking-tight text-red-500">THE TRIBE</h1>
            </Link>
            <CitySelector />
          </div>
          
          {/* Bottom curved edges */}
          <div className="absolute -bottom-4 left-4 w-8 h-8 bg-black rounded-bl-[2rem]"></div>
          <div className="absolute -bottom-4 right-4 w-8 h-8 bg-black rounded-br-[2rem]"></div>
        </div>
      </div>
      
      {/* Black search bar for AI Chat Input */}
      {chatInputProps && (
        <div className="px-4 pb-4">
          <div className="bg-black rounded-full border border-gray-700/50 mx-2 relative">
            {/* Rounded top corners for search bar */}
            <div className="absolute -top-2 left-4 w-4 h-4 bg-black rounded-tl-[1rem]"></div>
            <div className="absolute -top-2 right-4 w-4 h-4 bg-black rounded-tr-[1rem]"></div>
            
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