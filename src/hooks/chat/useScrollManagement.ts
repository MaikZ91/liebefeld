
import { useRef, useEffect } from 'react';
import { Message } from '@/types/chatTypes';

export const useScrollManagement = (messages: Message[], typingUsers: any[]) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesLengthRef = useRef<number>(0);

  useEffect(() => {
    console.log(`Message count changed: ${messages.length}, previous: ${messagesLengthRef.current}`);
    
    if (messages.length > messagesLengthRef.current) {
      console.log('New messages added, scrolling to bottom');
      setTimeout(() => {
        initializeScrollPosition();
      }, 100);
    }
    
    messagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setTimeout(() => {
        initializeScrollPosition();
      }, 100);
    }
  }, [typingUsers]);

  const initializeScrollPosition = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return {
    chatBottomRef,
    chatContainerRef,
    initializeScrollPosition
  };
};
