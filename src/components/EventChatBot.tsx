// src/components/EventChatBot.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, PlusCircle, MessageSquare, Bot } from 'lucide-react';
import ChatInput from '@/components/event-chat/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { useEventContext } from '@/contexts/EventContext';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { messageService } from '@/services/messageService';
import { eventChatService } from '@/services/eventChatService';
import { GroupChatMessages } from '@/components/chat/GroupChatMessages';
import { AiChatMessages } from '@/components/chat/AiChatMessages';
import { cn } from '@/lib/utils';

interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void;
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
  hideButtons?: boolean;
  // REMOVED: onChatInputPropsChange?: (props: any) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
}

const EventChatBot: React.FC<EventChatBotProps> = ({
  fullPage = false,
  onAddEvent,
  onToggleCommunity,
  activeChatMode,
  setActiveChatMode,
  hideButtons = false,
  // REMOVED: onChatInputPropsChange,
  onJoinEventChat
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { currentUser, userProfile } = useUserProfile();
  const { events } = useEventContext();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(messageService.DEFAULT_GROUP_ID);
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>('Allgemeiner Chat');
  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    const fetchAndSetMessages = async () => {
      if (selectedGroupId) {
        const fetchedMessages = await messageService.fetchMessages(selectedGroupId);
        setMessages(fetchedMessages);
      }
    };

    fetchAndSetMessages();

    const subscription = supabase
      .channel(`chat_messages_group_${selectedGroupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${selectedGroupId}` }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedGroupId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (currentMessage.trim() && currentUser) {
      if (activeChatMode === 'ai') {
        setIsAiTyping(true);
        const aiResponse = await eventChatService.sendAiMessage(currentMessage, events, currentUser);
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: Date.now(), sender: currentUser, content: currentMessage, group_id: 'ai', created_at: new Date().toISOString() },
          { id: Date.now() + 1, sender: 'AI', content: aiResponse, group_id: 'ai', created_at: new Date().toISOString() }
        ]);
        setIsAiTyping(false);
      } else {
        await messageService.sendMessage(selectedGroupId, currentUser, currentMessage);
      }
      setCurrentMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // REMOVED: useEffect to pass chatInputProps up to parent
  // useEffect(() => {
  //   if (onChatInputPropsChange) {
  //     onChatInputPropsChange({
  //       currentMessage,
  //       setCurrentMessage,
  //       handleSendMessage,
  //       handleKeyDown,
  //       activeChatModeValue: activeChatMode,
  //       selectedGroupId,
  //       setSelectedGroupId,
  //       selectedGroupTitle,
  //       setSelectedGroupTitle,
  //       onJoinEventChat,
  //       userProfile,
  //       currentUser,
  //     });
  //   }
  // }, [currentMessage, activeChatMode, selectedGroupId, selectedGroupTitle, onChatInputPropsChange, onJoinEventChat, userProfile, currentUser]);

  return (
    <div className={cn("flex flex-col h-full", { "border rounded-lg": !fullPage })}>
      {!hideButtons && (
        <div className="flex justify-center space-x-2 p-2 border-b">
          <Button
            onClick={() => setActiveChatMode && setActiveChatMode('community')}
            variant={activeChatMode === 'community' ? 'default' : 'outline'}
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Community Chat
          </Button>
          <Button
            onClick={() => setActiveChatMode && setActiveChatMode('ai')}
            variant={activeChatMode === 'ai' ? 'default' : 'outline'}
          >
            <Bot className="mr-2 h-4 w-4" /> AI Chat
          </Button>
        </div>
      )}
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {activeChatMode === 'ai' ? (
          <AiChatMessages messages={messages} isAiTyping={isAiTyping} />
        ) : (
          <GroupChatMessages messages={messages} currentUser={currentUser} />
        )}
      </ScrollArea>
      {/* ChatInput is now rendered in Layout, no longer here */}
    </div>
  );
};

export default EventChatBot;