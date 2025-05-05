
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
  const lastAutoScrollTimestampRef = useRef<number>(0);

  // Check if new messages were added and handle auto-scrolling appropriately
  useEffect(() => {
    console.log(`Message count changed: ${messages.length}, previous: ${messagesLengthRef.current}`);
    
    if (messages.length > messagesLengthRef.current) {
      console.log('New messages added, checking if auto-scroll is needed');
      
      // Only auto-scroll if user is at the bottom or not actively scrolling
      // AND we haven't auto-scrolled in the last second (prevents scroll jumping)
      const now = Date.now();
      const timeSinceLastScroll = now - lastAutoScrollTimestampRef.current;
      
      if (isAtBottom && !isUserScrolling && timeSinceLastScroll > 1000) {
        console.log('Auto-scrolling because user is at bottom or not actively scrolling');
        lastAutoScrollTimestampRef.current = now;
        setTimeout(() => {
          initializeScrollPosition();
        }, 100);
      } else {
        console.log('Not auto-scrolling because user has scrolled up', { 
          isAtBottom, 
          isUserScrolling,
          timeSinceLastScroll
        });
      }
    }
    
    messagesLengthRef.current = messages.length;
  }, [messages, isUserScrolling, isAtBottom]);

  // Handle typing indicators
  useEffect(() => {
    if (typingUsers.length > 0 && isAtBottom && !isUserScrolling) {
      // Only auto-scroll for typing indicators if user hasn't manually scrolled recently
      const now = Date.now();
      const timeSinceLastScroll = now - lastAutoScrollTimestampRef.current;
      
      if (timeSinceLastScroll > 1000) {
        console.log('Scrolling to show typing indicators');
        lastAutoScrollTimestampRef.current = now;
        setTimeout(() => {
          initializeScrollPosition();
        }, 100);
      }
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
      const newIsAtBottom = scrollBottom < 100; // Increased threshold a bit
      
      if (newIsAtBottom !== isAtBottom) {
        console.log(`Scroll position changed - is at bottom: ${newIsAtBottom}`);
        setIsAtBottom(newIsAtBottom);
      }
      
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
          } else {
            console.log('Keeping auto-scroll disabled as user is still not at bottom');
          }
        }, 15000); // Increased to 15 seconds - much longer timeout before re-enabling auto-scroll
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
  }, [isUserScrolling, isAtBottom]);

  // Initial scroll position setup on mobile - never auto-scroll on initial load in community chat
  useEffect(() => {
    if (isMobile && messages.length > 0) {
      // Use a slightly longer delay for mobile to ensure DOM is fully rendered
      setTimeout(() => {
        // Don't force scroll if user is already scrolling
        if (!isUserScrolling) {
          initializeScrollPosition();
        }
      }, 800);
    }
  }, [isMobile, messages.length, isUserScrolling]);

  const initializeScrollPosition = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth' });
    }
  };

  // Function to manually scroll to bottom (to be used by buttons or other UI elements)
  const scrollToBottom = () => {
    console.log('Manual scroll to bottom requested');
    setIsUserScrolling(false);
    setIsAtBottom(true);
    setTimeout(() => {
      lastAutoScrollTimestampRef.current = Date.now();
      initializeScrollPosition();
    }, 50);
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
