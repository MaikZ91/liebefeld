import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SwipeableEventPanel from './SwipeableEventPanel';
import SwipeableLandingPanel from './SwipeableLandingPanel';
import { useChatLogic } from './useChatLogic';
import { usePersonalization } from './usePersonalization';
import { Message } from './types';

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

  const {
    messages,
    input: internalInput,
    setInput: internalSetInput,
    isTyping: internalIsTyping,
    handleSendMessage: internalHandleSendMessage,
    handleKeyPress: internalHandleKeyPress,
    isHeartActive: internalIsHeartActive,
    handleHeartClick: internalHandleHeartClick,
    globalQueries,
    toggleRecentQueries: internalToggleRecentQueries,
    clearChat,
    activeCategory: internalActiveCategory,
    setActiveCategory: internalSetActiveCategory,
    showAnimatedPrompts: internalShowAnimatedPrompts
  } = useChatLogic(activeView);

  const {
    favoriteEvents,
    likedEventIds,
    handleLikeEvent: handleEventLike,
    handleRsvpEvent: handleEventRsvp
  } = usePersonalization();

  // Use external props if provided (for header integration), otherwise use internal state
  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = externalSetInput || internalSetInput;
  const handleSendMessage = externalHandleSendMessage || internalHandleSendMessage;
  const isTyping = externalIsTyping !== undefined ? externalIsTyping : internalIsTyping;
  const handleKeyPress = externalHandleKeyPress || internalHandleKeyPress;
  const isHeartActive = externalIsHeartActive !== undefined ? externalIsHeartActive : internalIsHeartActive;
  const handleHeartClick = externalHandleHeartClick || internalHandleHeartClick;
  const queries = externalGlobalQueries || globalQueries;
  const toggleRecentQueries = externalToggleRecentQueries || internalToggleRecentQueries;
  const finalInputRef = externalInputRef || inputRef;
  const onAddEvent = externalOnAddEvent;
  const showAnimatedPrompts = externalShowAnimatedPrompts !== undefined ? externalShowAnimatedPrompts : internalShowAnimatedPrompts;
  const activeCategory = externalActiveCategory !== undefined ? externalActiveCategory : internalActiveCategory;
  const onCategoryChange = externalOnCategoryChange || internalSetActiveCategory;

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
    handleEventLike(eventId);
  }, [handleEventLike]);

  const handleRsvpEvent = useCallback((eventId: string, option: 'yes' | 'no' | 'maybe') => {
    handleEventRsvp(eventId, option);
  }, [handleEventRsvp]);

  return (
    <div className="flex flex-col h-full bg-black text-white relative overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          activeView={activeView}
          favoriteEvents={favoriteEvents}
          likedEventIds={likedEventIds}
          onLikeEvent={handleLikeEvent}
          onRsvpEvent={handleRsvpEvent}
          onClearChat={clearChat}
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
          event={selectedEvent}
          onClose={handleEventClose}
          onLikeEvent={handleLikeEvent}
          onRsvpEvent={handleRsvpEvent}
          isLiked={likedEventIds.has(selectedEvent.id)}
        />
      )}

      {showLandingPanel && (
        <SwipeableLandingPanel onClose={handleLandingClose} />
      )}
    </div>
  );
};

export default FullPageChatBot;
