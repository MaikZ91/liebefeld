
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useMessageSubscription } from '@/hooks/chat/useMessageSubscription';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { messageService } from '@/services/messageService';

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
    
    try {
      console.log(`Directly fetching messages from messageService for group: ${groupId}`);
      const fetchedMessages = await messageService.fetchMessages(groupId);
      console.log(`Fetched ${fetchedMessages.length} messages directly from messageService`);
      
      setMessages(fetchedMessages);
      setLastSeen(new Date());
      
      // Nachrichten als gelesen markieren
      if (fetchedMessages.length > 0) {
        const unreadMessages = fetchedMessages.filter(
          msg => msg.user_name !== username
        );
        
        if (unreadMessages.length > 0) {
          messageService.markMessagesAsRead(
            groupId,
            unreadMessages.map(msg => msg.id),
            username
          );
        }
      }
    } catch (err) {
      console.error('Error fetching messages directly:', err);
    }
  }, [groupId, username]);
  
  // Handle new messages from subscription
  const handleNewMessage = useCallback((newMsg: Message) => {
    console.log('New message received via subscription:', newMsg);
    setMessages((oldMessages) => {
      // Doppelte Nachrichten vermeiden
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        return oldMessages;
      }
      
      // Nachricht als gelesen markieren, wenn sie von jemand anderem ist
      if (newMsg.user_name !== username) {
        messageService.markMessagesAsRead(groupId, [newMsg.id], username);
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
