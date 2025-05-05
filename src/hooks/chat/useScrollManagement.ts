
import { useRef, useEffect, useState } from 'react';
import { Message } from '@/types/chatTypes';
import { useIsMobile } from '@/hooks/use-mobile';

export const useScrollManagement = (messages: Message[], typingUsers: any[]) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesLengthRef = useRef<number>(0);
  const isMobile = useIsMobile();
  
  // Add state to track if user is manually scrolling
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log(`Message count changed: ${messages.length}, previous: ${messagesLengthRef.current}`);
    
    if (messages.length > messagesLengthRef.current) {
      console.log('New messages added, checking if auto-scroll is needed');
      
      // Only auto-scroll if user is at the bottom already or not actively scrolling
      if (!isUserScrolling) {
        setTimeout(() => {
          initializeScrollPosition();
        }, 100);
      }
    }
    
    messagesLengthRef.current = messages.length;
  }, [messages, isUserScrolling]);

  useEffect(() => {
    if (typingUsers.length > 0 && !isUserScrolling) {
      setTimeout(() => {
        initializeScrollPosition();
      }, 100);
    }
  }, [typingUsers, isUserScrolling]);

  // Set up scroll event listener to detect user scrolling
  useEffect(() => {
    const container = chatContainerRef.current;
    
    const handleScroll = () => {
      if (!container) return;
      
      // Detect if user is scrolling up
      if (container.scrollTop < lastScrollTop) {
        setIsUserScrolling(true);
        
        // Reset the auto-scroll after user has been inactive for a while
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
        }
        
        userScrollTimeoutRef.current = setTimeout(() => {
          setIsUserScrolling(false);
        }, 5000); // Reset after 5 seconds of inactivity
      }
      
      // If user scrolls to bottom, enable auto-scrolling again
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      if (isNearBottom) {
        setIsUserScrolling(false);
      }
      
      setLastScrollTop(container.scrollTop);
    };
    
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [lastScrollTop]);

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

  // Function to manually scroll to bottom (to be used by buttons or other UI elements)
  const scrollToBottom = () => {
    setIsUserScrolling(false);
    initializeScrollPosition();
  };

  return {
    chatBottomRef,
    chatContainerRef,
    initializeScrollPosition,
    scrollToBottom,
    isUserScrolling
  };
};
