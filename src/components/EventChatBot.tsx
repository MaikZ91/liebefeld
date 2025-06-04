
import React, { useState, useRef } from 'react';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { userService } from '@/services/userService';
import ProfileEditor from './users/ProfileEditor';
import FloatingChatBot from './event-chat/FloatingChatBot';
import FullPageChatBot from './event-chat/FullPageChatBot';
import { useChatLogic } from './event-chat/useChatLogic';
import { usePersonalization } from './event-chat/usePersonalization';
import { EventChatBotProps } from './event-chat/types';

const EventChatBot: React.FC<EventChatBotProps> = ({ 
  fullPage = false, 
  onAddEvent, 
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode,
  hideButtons = false
}) => {
  // Use the prop value if provided, otherwise use internal state
  const [internalActiveChatMode, setInternalActiveChatMode] = useState<'ai' | 'community'>('ai');
  const activeChatModeValue = activeChatMode !== undefined ? activeChatMode : internalActiveChatMode;
  const setActiveChatModeValue = setActiveChatMode || setInternalActiveChatMode;
  
  const { events } = useEventContext();
  const { toast } = useToast();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  const [communityGroupId, setCommunityGroupId] = useState('general');  // Default group ID
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  // Use the chat logic hook to manage state and functions, passing username for Perfect Day
  const chatLogic = useChatLogic(events, fullPage, activeChatModeValue, userProfile?.username);
  
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
        hideButtons={hideButtons}
      />
    );
  }

  // For the floating chatbot UI
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {chatLogic.isChatOpen ? (
        <FloatingChatBot
          isChatOpen={chatLogic.isChatOpen}
          handleToggleChat={chatLogic.handleToggleChat}
          chatLogic={chatLogic}
          activeChatModeValue={activeChatModeValue}
          communityGroupId={communityGroupId}
          fullPage={fullPage}
          onAddEvent={onAddEvent}
          hideButtons={hideButtons}
        />
      ) : (
        <button
          onClick={chatLogic.handleToggleChat}
          className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg bg-red-500 hover:bg-red-600 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {/* Profile Editor dialog */}
      <ProfileEditor
        open={isProfileEditorOpen}
        onOpenChange={setIsProfileEditorOpen}
        currentUser={userProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default EventChatBot;
