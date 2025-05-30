
import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { messageService } from '@/services/messageService';
import { supabase } from '@/integrations/supabase/client';

export const useChatMessages = (groupId: string, username: string) => {
  // Use a valid UUID for groupId, default to general if not provided
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const messagesRef = useRef<Message[]>(messages);
  const channelsRef = useRef<any[]>([]);
  const timeoutsRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  
  const { fetchMessages, loading, error, setError } = useMessageFetching(validGroupId);
  
  // Update the messages ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Handle new message with simple approach - only add if not already exists
  const handleNewMessage = useCallback((newMsg: Message) => {
    console.log('New message received via Realtime:', newMsg);
    
    setMessages((oldMessages) => {
      // Simple check: if message ID already exists, don't add it
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        console.log('Message already exists, skipping:', newMsg.id);
        return oldMessages;
      }
      
      console.log('Adding new message to state:', newMsg);
      
      // Mark message as read if from someone else
      if (newMsg.user_name !== username && username) {
        messageService.markMessagesAsRead(validGroupId, [newMsg.id], username);
      }
      
      return [...oldMessages, newMsg];
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
      .subscribe();
      
    channelsRef.current.push(typingChannel);
    
    return () => {
      if (typingChannel) {
        supabase.removeChannel(typingChannel);
      }
    };
  }, [validGroupId, username]);
  
  // Setup message listener - only one subscription
  useEffect(() => {
    if (!validGroupId || !username) {
      console.log('No group ID or username, skipping message subscription');
      return;
    }
    
    console.log('Setting up message subscription for group:', validGroupId);
    
    // Only listen to database changes, no local messages
    const messageChannel = supabase
      .channel(`messages:${validGroupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${validGroupId}`
      }, (payload) => {
        console.log('New message from database:', payload);
        
        if (payload.new) {
          const msg = payload.new as any;
          const newMessage: Message = {
            id: msg.id,
            created_at: msg.created_at,
            content: msg.text,
            user_name: msg.sender,
            user_avatar: msg.avatar || '',
            group_id: msg.group_id,
          };
          
          handleNewMessage(newMessage);
        }
      })
      .subscribe();
    
    channelsRef.current.push(messageChannel);
    
    return () => {
      console.log('Cleaning up message subscription');
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [validGroupId, username, handleNewMessage]);
  
  // Initial fetch when group changes
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
      
      const fetchedMessages = await messageService.fetchMessages(validGroupId);
      console.log(`Fetched ${fetchedMessages.length} messages`);
      
      // Clear everything and set fresh messages
      setMessages(fetchedMessages);
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
    fetchAndSetMessages
  };
};
