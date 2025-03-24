
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';

const EventChatBot: React.FC = () => {
  const isMobile = useIsMobile();
  const { events } = useEventContext();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize the chat bot after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // This component is a placeholder for now
  // The original had TypeScript errors accessing properties like 'emoji' and 'users'
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          toast({
            variant: "success",
            description: "Der Chat-Bot wird bald verfügbar sein!"
          });
        }}
        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shadow-lg transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </button>
    </div>
  );
};

export default EventChatBot;
