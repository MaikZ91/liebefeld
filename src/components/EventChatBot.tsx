
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
}

const EventChatBot: React.FC<ExtendedEventChatBotProps> = ({ 
  fullPage = false, 
  onAddEvent, 
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode,
  onChatInputPropsChange
}) => {
  const [internalActiveChatMode, setInternalActiveChatMode] = useState<'ai' | 'community'>('ai');
  const activeChatModeValue = activeChatMode !== undefined ? activeChatMode : internalActiveChatMode;
  const setActiveChatModeValue = setActiveChatMode || setInternalActiveChatMode;
  
  const [activeCategory, setActiveCategory] = useState<string>('Ausgehen');
  
  // State for external chat input control
  const [externalInput, setExternalInput] = useState<string>('');
  const [externalSendTriggered, setExternalSendTriggered] = useState<boolean>(false);
  
  const { selectedCity } = useEventContext();
  const { toast } = useToast();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  
  const communityGroupId = createCitySpecificGroupId(activeCategory, selectedCity);
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
    setActiveCategory(category);
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

  // Handle external input changes
  const handleExternalInputChange = (value: string) => {
    setExternalInput(value);
  };

  // Handle external send trigger
  const handleExternalSend = () => {
    setExternalSendTriggered(prev => !prev);
  };

  // Enhanced unified send message for header integration
  const handleUnifiedSendMessage = () => {
    if (activeChatModeValue === 'ai') {
      chatLogic.handleSendMessage();
    } else {
      // For community chat, trigger the external send
      handleExternalSend();
    }
  };

  // Enhanced unified input change for header integration
  const handleUnifiedInputChange = (value: string) => {
    if (activeChatModeValue === 'ai') {
      chatLogic.setInput(value);
    } else {
      setExternalInput(value);
    }
  };

  // Get current input value based on mode
  const getCurrentInputValue = () => {
    return activeChatModeValue === 'ai' ? chatLogic.input : externalInput;
  };

  // Provide chat input props to parent component
  useEffect(() => {
    if (onChatInputPropsChange && chatLogic) {
      onChatInputPropsChange({
        input: getCurrentInputValue(),
        setInput: handleUnifiedInputChange,
        handleSendMessage: handleUnifiedSendMessage,
        isTyping: chatLogic.isTyping,
        handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUnifiedSendMessage();
          }
        },
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
    getCurrentInputValue(),
    chatLogic.isTyping,
    chatLogic.isHeartActive,
    chatLogic.globalQueries.length,
    chatLogic.showAnimatedPrompts,
    activeCategory,
    activeChatModeValue,
    externalInput,
    onChatInputPropsChange
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
        onExternalInputChange={handleExternalInputChange}
        onExternalSend={handleExternalSend}
      />
    );
  }

  return null;
};

export default EventChatBot;
