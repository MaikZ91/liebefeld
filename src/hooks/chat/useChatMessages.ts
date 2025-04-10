
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useMessageSubscription } from '@/hooks/chat/useMessageSubscription';
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
    if (groupId && username) {
      console.log(`Gruppen-ID geändert, Nachrichten für Gruppe abrufen: ${groupId}`);
      fetchAndSetMessages();
    }
  }, [groupId, username]);
  
  const fetchAndSetMessages = useCallback(async () => {
    if (!groupId || !username) return;
    
    const fetchedMessages = await fetchMessages();
    setMessages(fetchedMessages);
    setLastSeen(new Date());
    
    // Nachrichten als gelesen markieren
    if (fetchedMessages.length > 0) {
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
  }, [groupId, username, fetchMessages]);
  
  // Handle new messages from subscription
  const handleNewMessage = useCallback((newMsg: Message) => {
    setMessages((oldMessages) => {
      // Doppelte Nachrichten vermeiden
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        return oldMessages;
      }
      
      // Nachricht als gelesen markieren, wenn sie von jemand anderem ist
      if (newMsg.user_name !== username) {
        chatService.markMessagesAsRead(groupId, [newMsg.id], username);
      }
      
      return [...oldMessages, newMsg];
    });
    
    setLastSeen(new Date());
  }, [groupId, username]);
  
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
