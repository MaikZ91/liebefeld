
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useMessageSubscription } from '@/hooks/chat/useMessageSubscription';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { messageService } from '@/services/messageService';
import { supabase } from '@/integrations/supabase/client';

export const useChatMessages = (groupId: string, username: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const messagesRef = useRef<Message[]>(messages);
  
  const { fetchMessages, loading, error, setError } = useMessageFetching(groupId);
  
  // Update the messages ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Initial setup for realtime
  useEffect(() => {
    // Configure realtime
    const setupRealtime = async () => {
      console.log('Setting up realtime in useChatMessages');
      await messageService.enableRealtime();
      
      // Enable real-time on the chat_messages table directly
      const { error } = await supabase.from('chat_messages').select('id').limit(1);
      if (error) {
        console.error('Error in initial query:', error);
      }
    };
    
    setupRealtime();
  }, []);
  
  // Fetch messages when group changes
  useEffect(() => {
    if (groupId && username) {
      console.log(`Group ID changed, fetching messages for: ${groupId}`);
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
      
      // Mark messages as read
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
  }, [groupId, username, fetchMessages]);
  
  // Handle new messages from subscription
  const handleNewMessage = useCallback((newMsg: Message) => {
    console.log('New message received via subscription:', newMsg);
    
    // Add message to state, avoiding duplicates
    setMessages((oldMessages) => {
      // Skip duplicates
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        console.log('Duplicate message detected, skipping');
        return oldMessages;
      }
      
      console.log('Adding new message to state');
      
      // Mark message as read if from someone else
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
    initializeScrollPosition,
    fetchAndSetMessages // Expose this so we can manually refresh
  };
};
