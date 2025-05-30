
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { messageService } from '@/services/messageService';
import { supabase } from '@/integrations/supabase/client';
import { realtimeService } from '@/services/realtimeService';

export const useChatMessages = (groupId: string, username: string) => {
  // Use a valid UUID for groupId, default to general if not provided
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const messagesRef = useRef<Message[]>(messages);
  const channelsRef = useRef<any[]>([]);
  const timeoutsRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  const { fetchMessages, loading, error, setError } = useMessageFetching(validGroupId);
  
  // Update the messages ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Handle new message with duplicate prevention
  const handleNewMessage = useCallback((newMsg: Message) => {
    console.log('New message received:', newMsg);
    
    // Check if this message has already been processed
    if (processedMessageIds.current.has(newMsg.id)) {
      console.log('Duplicate message detected, skipping:', newMsg.id);
      return;
    }
    
    // Add the message ID to the processed set
    processedMessageIds.current.add(newMsg.id);
    
    setMessages((oldMessages) => {
      // Double check if this message already exists to avoid duplicates
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        console.log('Duplicate message detected in state, skipping:', newMsg.id);
        return oldMessages;
      }
      
      console.log('Adding new message to state:', newMsg);
      
      // Mark message as read if from someone else
      if (newMsg.user_name !== username && username) {
        messageService.markMessagesAsRead(validGroupId, [newMsg.id], username);
      }
      
      // Process and parse event data before adding to messages
      try {
        const processedMsg = {
          ...newMsg,
          // We'll parse event data from content in the MessageList component
        };
        return [...oldMessages, processedMsg];
      } catch (error) {
        console.error('Error processing message:', error);
        return [...oldMessages, newMsg];
      }
    });
    
    setLastSeen(new Date());
  }, [validGroupId, username]);
  
  // Setup typing indicators
  useEffect(() => {
    if (!validGroupId || !username) return;
    
    console.log('Setting up typing indicator for group:', validGroupId);
    
    const typingChannel = supabase
      .channel(`typing:${validGroupId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing status update received:', payload);
        
        if (payload.payload && payload.payload.username !== username) {
          const { username: typingUsername, avatar, isTyping } = payload.payload;
          
          setTypingUsers(prev => {
            const currentUsers = [...prev];
            const existingIndex = currentUsers.findIndex(u => u.username === typingUsername);
            
            if (isTyping) {
              if (timeoutsRef.current[typingUsername]) {
                clearTimeout(timeoutsRef.current[typingUsername]);
              }
              
              timeoutsRef.current[typingUsername] = setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u.username !== typingUsername));
              }, 3000);
              
              const user = {
                username: typingUsername,
                avatar: avatar,
                lastTyped: new Date()
              };
              
              if (existingIndex >= 0) {
                currentUsers[existingIndex] = user;
              } else {
                currentUsers.push(user);
              }
            } else {
              if (existingIndex >= 0) {
                currentUsers.splice(existingIndex, 1);
              }
            }
            
            return currentUsers;
          });
        }
      })
      .subscribe((status) => {
        console.log('Typing channel subscription status:', status);
      });
      
    channelsRef.current.push(typingChannel);
    
    return () => {
      if (typingChannel) {
        supabase.removeChannel(typingChannel);
      }
    };
  }, [validGroupId, username]);
  
  useEffect(() => {
    if (!validGroupId || !username) {
      console.log('No group ID or username, skipping message subscription');
      return;
    }
    
    console.log('Setting up message listener for group:', validGroupId);
    
    // Clear the set of processed message IDs when changing groups
    processedMessageIds.current.clear();
    
    // Set up message listener using the realtimeService
    const channels = realtimeService.setupMessageListener(validGroupId, handleNewMessage);
    channelsRef.current = [...channelsRef.current, ...channels];
    
    return () => {
      console.log('Cleaning up message subscription');
      channels.forEach(channel => {
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            console.error('Error removing channel:', e);
          }
        }
      });
    };
  }, [validGroupId, username, handleNewMessage]);
  
  // Fetch messages when group changes
  useEffect(() => {
    if (validGroupId) {
      console.log(`Group ID changed, fetching messages for: ${validGroupId}`);
      fetchAndSetMessages();
    }
  }, [validGroupId]);
  
  const fetchAndSetMessages = useCallback(async () => {
    if (!validGroupId) return;
    
    try {
      console.log(`Fetching messages for group: ${validGroupId}`);
      
      // Clear processed message IDs before fetching
      processedMessageIds.current.clear();
      
      const fetchedMessages = await messageService.fetchMessages(validGroupId);
      console.log(`Fetched ${fetchedMessages.length} messages`);
      
      // Process messages to parse event data from content if needed
      const processedMessages = fetchedMessages.map(msg => {
        // Add all fetched message IDs to the processed set
        processedMessageIds.current.add(msg.id);
        return {
          ...msg,
          // We'll parse event data from content in the MessageList component
        };
      });
      
      setMessages(processedMessages);
      setLastSeen(new Date());
      
      // Mark messages as read
      if (fetchedMessages.length > 0 && username) {
        const unreadMessages = fetchedMessages.filter(
          msg => msg.user_name !== username
        );
        
        if (unreadMessages.length > 0) {
          messageService.markMessagesAsRead(
            validGroupId,
            unreadMessages.map(msg => msg.id),
            username
          );
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [validGroupId, username, fetchMessages]);
  
  // Reconnection handling
  const { isReconnecting, handleReconnect } = useReconnection(fetchAndSetMessages);
  
  const { chatBottomRef, chatContainerRef, initializeScrollPosition } = 
    useScrollManagement(messages, typingUsers);
  
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      channelsRef.current.forEach(channel => {
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            console.error('Error removing channel:', e);
          }
        }
      });
    };
  }, []);

  // Function to add optimistic messages with duplicate prevention
  const addOptimisticMessage = useCallback((message: Message) => {
    console.log('Adding optimistic message:', message);
    
    // Check for duplicates before adding
    if (processedMessageIds.current.has(message.id)) {
      console.log('Optimistic message already processed:', message.id);
      return;
    }
    
    // Add the message ID to the processed set to prevent duplication
    processedMessageIds.current.add(message.id);
    
    setMessages(prev => {
      // Double-check for duplicates in current state
      if (prev.some(msg => msg.id === message.id)) {
        console.log('Optimistic message already in state:', message.id);
        return prev;
      }
      return [...prev, message];
    });
  }, []);

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
    fetchAndSetMessages,
    addOptimisticMessage
  };
};
