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
  const { events, isLoading } = useEvents(selectedCity);

  return (
    <div className="absolute top-0 left-0 right-0 z-[1002]">
      {/* Live Ticker at the very top */}
      <LiveTicker 
        events={events} 
        isLoadingEvents={isLoading}
        selectedCity={selectedCity}
      />
      
      {/* Premium Header with Glassmorphism */}
      <div className="relative">
        <div className="bg-glass-bg backdrop-blur-xl border-b border-glass-border mx-4 px-6 py-5 relative rounded-bl-[2rem] shadow-xl">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-event-accent/10 via-transparent to-primary/10 rounded-bl-[2rem]" />
          
          {/* Main content */}
          <div className="flex items-center gap-6 relative z-10">
            <Link to="/" className="flex items-center group">
              <h1 className="font-serif text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-event-accent to-primary bg-clip-text text-transparent group-hover:from-event-accent group-hover:to-primary transition-all duration-500">
                THE TRIBE
              </h1>
            </Link>
            <div className="bg-muted/30 backdrop-blur-sm rounded-2xl p-1 border border-event-border/30">
              <CitySelector />
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium AI Chat Input */}
      {chatInputProps && (
        <div className="px-4 pb-6">
          <div className="bg-glass-bg backdrop-blur-xl rounded-2xl border border-glass-border mx-2 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-event-accent/20 via-primary/10 to-event-accent/20 h-0.5"></div>
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
              placeholder="Frage nach Events in deiner Stadt..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapHeader;