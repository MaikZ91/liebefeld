
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
  onChatLogicReady?: (chatLogic: any) => void;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const EventChatBot: React.FC<ExtendedEventChatBotProps> = ({ 
  fullPage = false, 
  onAddEvent, 
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode,
  onChatLogicReady,
  activeCategory = 'Ausgehen',
  onCategoryChange
}) => {
  // Use the prop value if provided, otherwise use internal state
  const [internalActiveChatMode, setInternalActiveChatMode] = useState<'ai' | 'community'>('ai');
  const activeChatModeValue = activeChatMode !== undefined ? activeChatMode : internalActiveChatMode;
  const setActiveChatModeValue = setActiveChatMode || setInternalActiveChatMode;
  
  const { selectedCity } = useEventContext();
  const { toast } = useToast();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  
  // Create city-specific group ID using UUID generation
  const communityGroupId = createCitySpecificGroupId(activeCategory, selectedCity);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  // Use the chat logic hook to manage state and functions - no longer pass events
  const chatLogic = useChatLogic(fullPage, activeChatModeValue);
  
  // Use personalization hook
  const { sendPersonalizedQuery } = usePersonalization(
    chatLogic.handleSendMessage, 
    { userProfile, currentUser, userService }
  );

  // Enhanced chatLogic with additional properties for header integration
  const enhancedChatLogic = {
    ...chatLogic,
    onAddEvent,
    activeCategory,
    onCategoryChange
  };

  // Expose chatLogic to parent component
  useEffect(() => {
    if (onChatLogicReady && enhancedChatLogic) {
      onChatLogicReady(enhancedChatLogic);
    }
  }, [onChatLogicReady, enhancedChatLogic]);

  const handleToggleChatMode = () => {
    const newMode = activeChatModeValue === 'ai' ? 'community' : 'ai';
    setActiveChatModeValue(newMode);
    
    // If switching to community mode and there's a parent toggle function, call it
    if (activeChatModeValue === 'ai' && onToggleCommunity) {
      onToggleCommunity();
    }
  };

  // Handle profile update
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

  if (!chatLogic.isVisible) return null;

  // If we're in fullPage mode, render a different UI
  if (fullPage) {
    return (
      <FullPageChatBot
        chatLogic={enhancedChatLogic}
        activeChatModeValue={activeChatModeValue}
        communityGroupId={communityGroupId}
        onAddEvent={onAddEvent}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />
    );
  }

  // The floating chatbot has been removed.
  return null;
};

export default EventChatBot;
