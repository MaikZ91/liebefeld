
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SwipeableEventPanel from './SwipeableEventPanel';
import SwipeableLandingPanel from './SwipeableLandingPanel';
import { useChatLogic } from './useChatLogic';
import { usePersonalization } from './usePersonalization';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { userService } from '@/services/userService';
import { ChatMessage } from './types';

interface FullPageChatBotProps {
  activeView: 'ai' | 'community';
  externalInput?: string;
  externalSetInput?: (value: string) => void;
  externalHandleSendMessage?: () => void;
  externalIsTyping?: boolean;
  externalHandleKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  externalIsHeartActive?: boolean;
  externalHandleHeartClick?: () => void;
  externalGlobalQueries?: any[];
  externalToggleRecentQueries?: () => void;
  externalInputRef?: React.RefObject<HTMLInputElement>;
  externalOnAddEvent?: () => void;
  externalShowAnimatedPrompts?: boolean;
  externalActiveCategory?: string;
  externalOnCategoryChange?: (category: string) => void;
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  activeView,
  externalInput,
  externalSetInput,
  externalHandleSendMessage,
  externalIsTyping,
  externalHandleKeyPress,
  externalIsHeartActive,
  externalHandleHeartClick,
  externalGlobalQueries,
  externalToggleRecentQueries,
  externalInputRef,
  externalOnAddEvent,
  externalShowAnimatedPrompts,
  externalActiveCategory,
  externalOnCategoryChange
}) => {
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const location = useLocation();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showLandingPanel, setShowLandingPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatLogic = useChatLogic(activeView === 'ai');
  const { currentUser, userProfile } = useUserProfile();

  const personalization = usePersonalization({
    userProfile,
    currentUser,
    userService
  });

  // Use external props if provided (for header integration), otherwise use internal state
  const input = externalInput !== undefined ? externalInput : chatLogic.input;
  const setInput = externalSetInput || chatLogic.setInput;
  const handleSendMessage = externalHandleSendMessage || chatLogic.handleSendMessage;
  const isTyping = externalIsTyping !== undefined ? externalIsTyping : chatLogic.isTyping;
  const handleKeyPress = externalHandleKeyPress || chatLogic.handleKeyPress;
  const isHeartActive = externalIsHeartActive !== undefined ? externalIsHeartActive : chatLogic.isHeartActive;
  const handleHeartClick = externalHandleHeartClick || chatLogic.handleHeartClick;
  const queries = externalGlobalQueries || chatLogic.globalQueries;
  const toggleRecentQueries = externalToggleRecentQueries || chatLogic.toggleRecentQueries;
  const finalInputRef = externalInputRef || inputRef;
  const onAddEvent = externalOnAddEvent;
  const showAnimatedPrompts = externalShowAnimatedPrompts !== undefined ? externalShowAnimatedPrompts : chatLogic.showAnimatedPrompts;
  const activeCategory = externalActiveCategory !== undefined ? externalActiveCategory : '';
  const onCategoryChange = externalOnCategoryChange || (() => {});

  useEffect(() => {
    if (location.hash === '#users') {
      setIsUserDirectoryOpen(true);
    }
  }, [location.hash]);

  useEffect(() => {
    const handleEventClick = (event: CustomEvent) => {
      setSelectedEvent(event.detail);
      setShowEventDetails(true);
    };

    const handleLandingClick = () => {
      setShowLandingPanel(true);
    };

    window.addEventListener('eventCardClick', handleEventClick as EventListener);
    window.addEventListener('landingCardClick', handleLandingClick as EventListener);

    return () => {
      window.removeEventListener('eventCardClick', handleEventClick as EventListener);
      window.removeEventListener('landingCardClick', handleLandingClick as EventListener);
    };
  }, []);

  const handleEventClose = useCallback(() => {
    setSelectedEvent(null);
    setShowEventDetails(false);
  }, []);

  const handleLandingClose = useCallback(() => {
    setShowLandingPanel(false);
  }, []);

  const handleLikeEvent = useCallback((eventId: string) => {
    if (personalization.handleLikeEvent) {
      personalization.handleLikeEvent(eventId);
    }
  }, [personalization]);

  const handleRsvpEvent = useCallback((eventId: string, option: 'yes' | 'no' | 'maybe') => {
    if (personalization.handleRsvpEvent) {
      personalization.handleRsvpEvent(eventId, option);
    }
  }, [personalization]);

  return (
    <div className="flex flex-col h-full bg-black text-white relative overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={chatLogic.messages}
          isTyping={isTyping}
          handleDateSelect={() => {}}
          messagesEndRef={useRef<HTMLDivElement>(null)}
          examplePrompts={[]}
          handleExamplePromptClick={() => {}}
        />
      </div>
      
      {location.pathname === '/chat' && (
        <div className="sticky bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 p-3">
          <ChatInput
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            isTyping={isTyping}
            handleKeyPress={handleKeyPress}
            isHeartActive={isHeartActive}
            handleHeartClick={handleHeartClick}
            globalQueries={queries}
            toggleRecentQueries={toggleRecentQueries}
            inputRef={finalInputRef}
            onAddEvent={onAddEvent}
            showAnimatedPrompts={showAnimatedPrompts}
            activeChatModeValue={activeView}
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
          />
        </div>
      )}

      {showEventDetails && selectedEvent && (
        <SwipeableEventPanel
          onClose={handleEventClose}
        />
      )}

      {showLandingPanel && (
        <SwipeableLandingPanel
          slideData={{
            title: 'Landing Panel',
            description: 'Description',
            image: ''
          }}
        />
      )}
    </div>
  );
};

export default FullPageChatBot;
