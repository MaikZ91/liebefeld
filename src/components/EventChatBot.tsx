
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

  // Provide chat input props to parent component
  useEffect(() => {
    if (onChatInputPropsChange && chatLogic) {
      onChatInputPropsChange({
        input: chatLogic.input,
        setInput: chatLogic.setInput,
        handleSendMessage: chatLogic.handleSendMessage,
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
    chatLogic.isTyping,
    chatLogic.isHeartActive,
    chatLogic.globalQueries.length,
    chatLogic.showAnimatedPrompts,
    activeCategory,
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
      />
    );
  }

  return null;
};

export default EventChatBot;
