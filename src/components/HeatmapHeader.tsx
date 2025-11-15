import React, { useState } from 'react';
import ChatInput from './event-chat/ChatInput';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';

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
  const miaAvatarUrl = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

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

  const categories = ['Party','Art', 'Comedy', 'Concerts','Sport' 'Meetups'];

  const handleCategoryClick = (category: string) => {
    if (chatInputProps) {
      const prompt = `Zeige mir Events für ${category}`;
      chatInputProps.setInput(prompt);
      chatInputProps.handleSendMessage(prompt);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[1002]">
      {/* Slim urban header bar */}
      <div className="bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Tonight in Berlin + Categories */}
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
              <span className="text-white/60 text-sm font-light whitespace-nowrap">
                Tonight in Bielefeld
              </span>
              
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="text-white/80 hover:text-white text-sm font-light whitespace-nowrap transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Right: MIA KI */}
            <button
              onClick={handleMiaIconClick}
              disabled={isDailyRecommendationLoading}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50 ml-4 shrink-0"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={miaAvatarUrl} alt="MIA" />
              </Avatar>
              <span className="text-white text-xs font-medium">
                {isDailyRecommendationLoading ? '...' : 'MIA'}
              </span>
              
              {/* Notification badge */}
              {hasNewDailyRecommendation && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Search bar overlay when MIA is clicked */}
      {showSearchBar && chatInputProps && (
        <div className="bg-black/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
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
                className="text-white hover:bg-white/10 shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapHeader;
