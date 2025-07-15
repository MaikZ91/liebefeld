// src/components/EventChatBot.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Not directly used anymore, but might be needed for sub-components
import { ScrollArea } from '@/components/ui/scroll-area'; // Not directly used anymore
import { Send, PlusCircle, MessageSquare, Bot } from 'lucide-react'; // Not directly used anymore
import ChatInput from '@/components/event-chat/ChatInput'; // Used via FullPageChatBot
import { supabase } from '@/integrations/supabase/client'; // Used by useChatLogic
import { useEventContext } from '@/contexts/EventContext';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { messageService } from '@/services/messageService'; // Used by useChatLogic
import { eventChatService } from '@/services/eventChatService'; // Used by useChatLogic
// import { GroupChatMessages } from '@/components/chat/GroupChatMessages'; // REMOVE
// import { AiChatMessages } from '@/components/chat/AiChatMessages'; // REMOVE
import { cn } from '@/lib/utils';
import FullPageChatBot from '@/components/event-chat/FullPageChatBot'; // Use this as the main child
import { useChatLogic } from '@/components/event-chat/useChatLogic'; // Import useChatLogic

interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void;
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
  hideButtons?: boolean;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
}

const EventChatBot: React.FC<EventChatBotProps> = ({
  fullPage = false,
  onAddEvent,
  onToggleCommunity,
  activeChatMode: propActiveChatMode, // Rename to avoid collision with local state
  setActiveChatMode: setPropActiveChatMode, // Rename to avoid collision with local state
  hideButtons = false,
  onJoinEventChat
}) => {
  // Use local state for activeChatMode if not provided as a prop
  const [activeChatMode, setActiveChatMode] = useState<'ai' | 'community'>(propActiveChatMode || 'ai');

  // Use the chat logic hook
  const chatLogic = useChatLogic(fullPage, activeChatMode);

  // Access user profile from hook
  const { currentUser, userProfile } = useUserProfile();

  // If activeChatMode is controlled by a prop, sync local state
  useEffect(() => {
    if (propActiveChatMode) {
      setActiveChatMode(propActiveChatMode);
    }
  }, [propActiveChatMode]);

  // Handle mode change via prop function if provided
  const handleModeChange = (mode: 'ai' | 'community') => {
    setActiveChatMode(mode);
    if (setPropActiveChatMode) {
      setPropActiveChatMode(mode);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", { "border rounded-lg": !fullPage })}>
      {!hideButtons && (
        <div className="flex justify-center space-x-2 p-2 border-b">
          <Button
            onClick={() => handleModeChange('community')}
            variant={activeChatMode === 'community' ? 'default' : 'outline'}
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Community Chat
          </Button>
          <Button
            onClick={() => handleModeChange('ai')}
            variant={activeChatMode === 'ai' ? 'default' : 'outline'}
          >
            <Bot className="mr-2 h-4 w-4" /> AI Chat
          </Button>
        </div>
      )}
      
      {/* Render FullPageChatBot with all necessary props */}
      <FullPageChatBot
        chatLogic={chatLogic}
        activeChatModeValue={activeChatMode}
        communityGroupId={messageService.DEFAULT_GROUP_ID} // Default community group
        onAddEvent={onAddEvent}
        onCategoryChange={(category) => console.log('Category changed:', category)} // Placeholder
        onJoinEventChat={onJoinEventChat}
        hideButtons={hideButtons}
        // Assuming FullPageChatBot manages its own input/typing when not hidden
        // For externalInput, we might need a more complex setup if EventChatBot truly controls it
        // but given the errors, it seems FullPageChatBot handles its own input state
      />
    </div>
  );
};

export default EventChatBot;