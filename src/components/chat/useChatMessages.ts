
import { useState, useEffect, useRef } from 'react';
import { Message, TypingUser } from '@/types/chatTypes';
import { useMessageFetching } from '@/hooks/chat/useMessageFetching';
import { useMessageSubscription } from '@/hooks/chat/useMessageSubscription';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { useReconnection } from '@/hooks/chat/useReconnection';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { chatService } from '@/services/chatService';
import { messageService } from '@/services/messageService';
import { useIsMobile } from '@/hooks/use-mobile';

export const useChatMessages = (groupId: string, username: string) => {
  // Use a valid UUID for groupId, default to general if not provided
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const messagesRef = useRef<Message[]>(messages);
  const isMobile = useIsMobile();
  const [whatsAppMessageAdded, setWhatsAppMessageAdded] = useState(false);
  
  const { fetchMessages, loading, error, setError } = useMessageFetching(validGroupId);
  
  // Update the messages ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Fetch messages when group changes
  useEffect(() => {
    if (validGroupId) {
      console.log(`Group ID changed, fetching messages for: ${validGroupId}`);
      fetchAndSetMessages();
    }
  }, [validGroupId]);
  
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
          validGroupId,
          unreadMessages.map(msg => msg.id),
          username
        );
      }
    }
    
    // Add WhatsApp community message if no messages exist
    if (fetchedMessages.length === 0 && !whatsAppMessageAdded) {
      addWhatsAppCommunityMessage();
    }
  };
  
  // Add WhatsApp community message
  const addWhatsAppCommunityMessage = () => {
    const whatsAppLink = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
    const systemMessage: Message = {
      id: `whatsapp-info-${Date.now()}`,
      created_at: new Date().toISOString(),
      content: `Die Community Interaktion findet derzeit auf WhatsApp statt. Bitte treten Sie unserer WhatsApp-Community bei: ${whatsAppLink}`,
      user_name: 'System',
      user_avatar: '',
      group_id: validGroupId,
      read_by: username ? [username] : []
    };
    
    setMessages(prev => [...prev, systemMessage]);
    setWhatsAppMessageAdded(true);
  };
  
  // Handle new messages from subscription
  const handleNewMessage = (newMsg: Message) => {
    setMessages((oldMessages) => {
      if (oldMessages.some(msg => msg.id === newMsg.id)) {
        return oldMessages;
      }
      
      // Mark message as read if it's from someone else
      if (newMsg.user_name !== username && username) {
        chatService.markMessagesAsRead(validGroupId, [newMsg.id], username);
      }
      
      return [...oldMessages, newMsg];
    });
    
    setLastSeen(new Date());
  };
  
  // Set up the subscription
  const { typingUsers } = useMessageSubscription(
    validGroupId, 
    handleNewMessage, 
    fetchAndSetMessages,
    username
  );
  
  // Reconnection handling
  const { isReconnecting, handleReconnect } = useReconnection(fetchAndSetMessages);
  
  // Scroll management with mobile awareness
  const { chatBottomRef, chatContainerRef, initializeScrollPosition } = 
    useScrollManagement(messages, typingUsers);
  
  // Force scroll to bottom after the component mounts on mobile
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        initializeScrollPosition();
      }, 800); // Longer delay for mobile
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, initializeScrollPosition]);

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
    addWhatsAppCommunityMessage
  };
};
