
import { useState, useEffect, useRef } from 'react';
import { Message, TypingUser } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useMessageSubscription } from '@/hooks/chat/useMessageSubscription';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { chatService } from '@/services/chatService';

export const useChatMessages = (groupId: string, username: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const messagesRef = useRef<Message[]>(messages);
  
  const { fetchMessages, loading, error, setError } = useMessageFetching(groupId);
  
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
    
    // Mark messages as read
    if (fetchedMessages.length > 0 && username) {
      const unreadMessages = fetchedMessages.filter(
        msg => msg.user_name !== username
      );
      
      if (unreadMessages.length > 0) {
        chatService.markMessagesAsRead(
          groupId,
          unreadMessages.map(msg => msg.id),
          username
        );
      }
    }
  };
  
  // Handle new messages from subscription
  const handleNewMessage = (newMsg: Message) => {
    setMessages((oldMessages) => {
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        return oldMessages;
      }
      
      // Mark message as read if it's from someone else
      if (newMsg.user_name !== username && username) {
        chatService.markMessagesAsRead(groupId, [newMsg.id], username);
      }
      
      return [...oldMessages, newMsg];
    });
    
    setLastSeen(new Date());
  };
  
  // Set up the subscription
  const { typingUsers } = useMessageSubscription(
    groupId, 
    handleNewMessage, 
    fetchAndSetMessages,
    username
  );
  
  // Reconnection handling
  const { isReconnecting, handleReconnect } = useReconnection(fetchAndSetMessages);
  
  // Scroll management
  const { chatBottomRef, chatContainerRef, initializeScrollPosition } = 
    useScrollManagement(messages, typingUsers);

  return {
    messages,
    loading,
    error,
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
