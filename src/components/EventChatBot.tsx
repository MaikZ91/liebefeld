
import React, { useState, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { userService } from '@/services/userService';
import ProfileEditor from './users/ProfileEditor';
import FullPageChatBot from './event-chat/FullPageChatBot';
import { useChatLogic } from './event-chat/useChatLogic';
import { usePersonalization } from './event-chat/usePersonalization';
import { EventChatBotProps } from './event-chat/types';

const EventChatBot: React.FC<EventChatBotProps> = ({ 
  fullPage = false, 
  onAddEvent, 
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode
}) => {
  // Use the prop value if provided, otherwise use internal state
  const [internalActiveChatMode, setInternalActiveChatMode] = useState<'ai' | 'community'>('ai');
  const activeChatModeValue = activeChatMode !== undefined ? activeChatMode : internalActiveChatMode;
  const setActiveChatModeValue = setActiveChatMode || setInternalActiveChatMode;
  
  // Add category state management - changed default to 'Ausgehen'
  const [activeCategory, setActiveCategory] = useState<string>('Ausgehen');
  
  const { events, selectedCity } = useEventContext();
  const { toast } = useToast();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  
  // Create city-specific group mapping for categories
  const createCitySpecificGroupId = (category: string, cityAbbr: string): string => {
    const normalizedCity = cityAbbr.toLowerCase();
    const normalizedCategory = category.toLowerCase();
    
    // Create city-specific group ID format: {city}_{category}
    return `${normalizedCity}_${normalizedCategory}`;
  };
  
  const communityGroupId = createCitySpecificGroupId(activeCategory, selectedCity);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  // Use the chat logic hook to manage state and functions
  const chatLogic = useChatLogic(events, fullPage, activeChatModeValue);
  
  // Use personalization hook
  const { sendPersonalizedQuery } = usePersonalization(
    chatLogic.handleSendMessage, 
    { userProfile, currentUser, userService }
  );

  const handleToggleChatMode = () => {
    const newMode = activeChatModeValue === 'ai' ? 'community' : 'ai';
    setActiveChatModeValue(newMode);
    
    // If switching to community mode and there's a parent toggle function, call it
    if (activeChatModeValue === 'ai' && onToggleCommunity) {
      onToggleCommunity();
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
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
        chatLogic={chatLogic}
        activeChatModeValue={activeChatModeValue}
        communityGroupId={communityGroupId}
        onAddEvent={onAddEvent}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
    );
  }

  // The floating chatbot has been removed.
  return null;
};

export default EventChatBot;
