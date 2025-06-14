
import { useRef, useEffect, useState } from 'react';
import { Message } from '@/types/chatTypes';
import { useIsMobile } from '@/hooks/use-mobile';

export const useScrollManagement = (messages: Message[], typingUsers: any[]) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesLengthRef = useRef<number>(0);
  const isMobile = useIsMobile();
  
  // Enhanced scrolling detection state
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionsRef = useRef<number[]>([]);

  // Check if new messages were added and handle auto-scrolling appropriately
  useEffect(() => {
    console.log(`Message count changed: ${messages.length}, previous: ${messagesLengthRef.current}`);
    
    if (messages.length > messagesLengthRef.current) {
      console.log('New messages added, checking if auto-scroll is needed');
      
      // Only auto-scroll if user is at the bottom or not actively scrolling
      if (isAtBottom && !isUserScrolling) {
        console.log('Auto-scrolling because user is at bottom or not actively scrolling');
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.log('Not auto-scrolling because user has scrolled up', { isAtBottom, isUserScrolling });
      }
    }
    
    messagesLengthRef.current = messages.length;
  }, [messages, isUserScrolling, isAtBottom]);

  // Handle typing indicators
  useEffect(() => {
    if (typingUsers.length > 0 && isAtBottom && !isUserScrolling) {
      console.log('Scrolling to show typing indicators');
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [typingUsers, isUserScrolling, isAtBottom]);

  // Set up scroll event listener with enhanced detection
  useEffect(() => {
    const container = chatContainerRef.current;
    
    const handleScroll = () => {
      if (!container) return;
      
      // Store the current scroll position to better detect direction
      scrollPositionsRef.current.push(container.scrollTop);
      if (scrollPositionsRef.current.length > 3) {
        scrollPositionsRef.current.shift(); // Keep only the last 3 positions
      }
      
      // Calculate if user is actively scrolling up
      const isScrollingUp = 
        scrollPositionsRef.current.length > 1 && 
        scrollPositionsRef.current[scrollPositionsRef.current.length - 1] < 
        scrollPositionsRef.current[scrollPositionsRef.current.length - 2];
        
      // Detect if scroll is near bottom
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const newIsAtBottom = scrollBottom < 50;
      setIsAtBottom(newIsAtBottom);
      
      // If scrolling up, prevent auto-scrolling
      if (isScrollingUp) {
        console.log('User is scrolling up, disabling auto-scroll');
        setIsUserScrolling(true);
        
        // Reset the auto-scroll timer
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
        }
        
        userScrollTimeoutRef.current = setTimeout(() => {
          // Only re-enable auto-scroll if user has scrolled back to bottom
          if (newIsAtBottom) {
            console.log('Re-enabling auto-scroll after timeout');
            setIsUserScrolling(false);
          }
        }, 8000); // Increased from 5 to 8 seconds
      }
      
      // If scrolled back to bottom, re-enable auto-scrolling immediately
      if (newIsAtBottom && isUserScrolling) {
        console.log('User scrolled to bottom, enabling auto-scroll immediately');
        setIsUserScrolling(false);
        
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
          userScrollTimeoutRef.current = null;
        }
      }
      
      setLastScrollTop(container.scrollTop);
    };
    
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [isUserScrolling]);

  // Improved scroll to bottom function
  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      // Use immediate scroll to prevent overscrolling
      container.scrollTop = container.scrollHeight;
    }
    
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ 
        behavior: isMobile ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  };

  // Initial scroll position setup
  const initializeScrollPosition = () => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  return {
    chatBottomRef,
    chatContainerRef,
    initializeScrollPosition,
    scrollToBottom,
    isUserScrolling,
    isAtBottom
  };
};
