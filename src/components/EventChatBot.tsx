
import React, { useState, useRef, useEffect } from 'react';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { userService } from '@/services/userService';
import ProfileEditor from './users/ProfileEditor';
import FullPageChatBot from './event-chat/FullPageChatBot';
import { useChatLogic } from './event-chat/useChatLogic';
import { usePersonalization } from './event-chat/usePersonalization';
import { EventChatBotProps } from './event-chat/types';
import { createCitySpecificGroupId } from '@/utils/groupIdUtils';

interface ExtendedEventChatBotProps extends EventChatBotProps {
  onChatInputPropsChange?: (props: any) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  onCreatePoll?: (poll: { question: string; options: string[] }) => void;
}

const EventChatBot: React.FC<ExtendedEventChatBotProps> = ({ 
  fullPage = false, 
  onAddEvent, 
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode,
  onChatInputPropsChange,
  onJoinEventChat,
  onCreatePoll
}) => {
  const [internalActiveChatMode, setInternalActiveChatMode] = useState<'ai' | 'community'>('ai');
  const activeChatModeValue = activeChatMode !== undefined ? activeChatMode : internalActiveChatMode;
  const setActiveChatModeValue = setActiveChatMode || setInternalActiveChatMode;
  
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    // Load from localStorage on component mount
    try {
      const { getActiveCategory } = require('@/utils/chatPreferences');
      const result = getActiveCategory();
      console.log('EventChatBot: loading stored category =', result);
      return result;
    } catch (error) {
      console.error('EventChatBot: error loading category =', error);
      return 'Ausgehen';
    }
  });
  
  // External input state for header synchronization
  const [externalInput, setExternalInput] = useState<string>('');
  const [externalSendHandler, setExternalSendHandler] = useState<(() => void) | null>(null);
  
  const { selectedCity } = useEventContext();
  const { toast } = useToast();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  
  const communityGroupId = createCitySpecificGroupId(activeCategory.toLowerCase(), selectedCity);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  const chatLogic = useChatLogic(fullPage, activeChatModeValue);
  
  const { sendPersonalizedQuery } = usePersonalization(
    chatLogic.handleSendMessage, 
    { userProfile, currentUser, userService }
  );

  const handleToggleChatMode = () => {
    const newMode = activeChatModeValue === 'ai' ? 'community' : 'ai';
    setActiveChatModeValue(newMode);
    
    if (activeChatModeValue === 'ai' && onToggleCommunity) {
      onToggleCommunity();
    }
  };

  const handleCategoryChange = (category: string) => {
    console.log('EventChatBot: changing category from', activeCategory, 'to', category);
    setActiveCategory(category);
    // Save to localStorage
    try {
      const { saveActiveCategory } = require('@/utils/chatPreferences');
      saveActiveCategory(category);
    } catch (error) {
      console.error('EventChatBot: error saving category preference:', error);
    }
  };

  const handleProfileUpdate = () => {
    if (userProfile) {
      refetchProfile();
      toast({
        title: "Willkommen " + userProfile.username + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
    }
  };

  // Function to handle external input changes
  const handleExternalInputChange = (value: string) => {
    setExternalInput(value);
  };

  // Function to handle external send
  const handleExternalSend = () => {
    if (externalSendHandler) {
      externalSendHandler();
    }
  };

  // Provide chat input props to parent component
  useEffect(() => {
    if (onChatInputPropsChange && chatLogic) {
      onChatInputPropsChange({
        input: activeChatModeValue === 'ai' ? chatLogic.input : externalInput,
        setInput: activeChatModeValue === 'ai' ? chatLogic.setInput : handleExternalInputChange,
        handleSendMessage: activeChatModeValue === 'ai' ? chatLogic.handleSendMessage : handleExternalSend,
        isTyping: chatLogic.isTyping,
        handleKeyPress: chatLogic.handleKeyPress,
        isHeartActive: chatLogic.isHeartActive,
        handleHeartClick: chatLogic.handleHeartClick,
        globalQueries: chatLogic.globalQueries,
        toggleRecentQueries: chatLogic.toggleRecentQueries,
        inputRef: chatLogic.inputRef,
        onAddEvent: onAddEvent,
        showAnimatedPrompts: chatLogic.showAnimatedPrompts,
        activeCategory: activeCategory,
        onCategoryChange: handleCategoryChange
      });
    }
  }, [
    chatLogic.input,
    externalInput,
    chatLogic.isTyping,
    chatLogic.isHeartActive,
    chatLogic.globalQueries.length,
    chatLogic.showAnimatedPrompts,
    activeCategory,
    activeChatModeValue,
    onChatInputPropsChange,
    externalSendHandler
  ]);

  if (!chatLogic.isVisible) return null;

  if (fullPage) {
    return (
      <FullPageChatBot
        chatLogic={chatLogic}
        activeChatModeValue={activeChatModeValue}
        communityGroupId={communityGroupId}
        onAddEvent={onAddEvent}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        hideInput={true}
        externalInput={externalInput}
        setExternalInput={setExternalInput}
        onExternalSendHandlerChange={setExternalSendHandler}
        onJoinEventChat={onJoinEventChat}
        onCreatePoll={onCreatePoll}
      />
    );
  }

  return null;
};

export default EventChatBot;
