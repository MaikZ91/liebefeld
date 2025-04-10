
import { useState, useEffect, useRef } from 'react';
import { Message, TypingUser } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useMessageSubscription } from '@/hooks/chat/useMessageSubscription';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';

export const useChatMessages = (groupId: string, username: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const messagesRef = useRef<Message[]>(messages);
  
  const { fetchMessages, loading, error, setError } = useMessageFetching(groupId);
  const { typingUsers, typing } = useTypingIndicator(groupId, username);
  
  // Update the messages ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Fetch messages when group changes
  useEffect(() => {
    if (groupId) {
      console.log(`Group ID changed, fetching messages for: ${groupId}`);
      fetchAndSetMessages();
    }
  }, [groupId]);
  
  const fetchAndSetMessages = async () => {
    const fetchedMessages = await fetchMessages();
    setMessages(fetchedMessages);
    setLastSeen(new Date());
  };
  
  // Handle new messages from subscription
  const handleNewMessage = (newMsg: Message) => {
    setMessages((oldMessages) => {
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        return oldMessages;
      }
      return [...oldMessages, newMsg];
    });
    
    setLastSeen(new Date());
  };
  
  // Set up the subscription
  useMessageSubscription(groupId, handleNewMessage, fetchAndSetMessages);
  
  // Reconnection handling
  const { isReconnecting, handleReconnect } = useReconnection(fetchAndSetMessages);
  
  // Scroll management
  const { chatBottomRef, chatContainerRef, initializeScrollPosition } = 
    useScrollManagement(messages, typingUsers);

  return {
    messages,
    loading,
    error,
    typing,
    typingUsers,
    isReconnecting,
    setMessages,
    setError,
    handleReconnect,
    chatBottomRef,
    chatContainerRef,
    initializeScrollPosition
  };
};
