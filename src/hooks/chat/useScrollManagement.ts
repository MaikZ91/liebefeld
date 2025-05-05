
import { useRef, useEffect } from 'react';
import { Message } from '@/types/chatTypes';
import { useIsMobile } from '@/hooks/use-mobile';

export const useScrollManagement = (messages: Message[], typingUsers: any[]) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesLengthRef = useRef<number>(0);
  const isMobile = useIsMobile();

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

  // Add an effect to ensure initial scroll position is set correctly on mobile
  useEffect(() => {
    if (isMobile) {
      // Use a slightly longer delay for mobile to ensure DOM is fully rendered
      setTimeout(() => {
        initializeScrollPosition();
      }, 500); // Increased from 300 to 500 for better mobile rendering
    }
  }, [isMobile]);

  const initializeScrollPosition = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth' });
    }
  };

  return {
    chatBottomRef,
    chatContainerRef,
    initializeScrollPosition
  };
};
