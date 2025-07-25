// src/pages/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/layouts/Layout';
// ALL OTHER IMPORTS ARE COMMENTED OUT OR REMOVED FOR THIS EXTREME TEST
// import EventChatBot from '@/components/EventChatBot';
// import LiveTicker from '@/components/LiveTicker'; 
// import { Button } from '@/components/ui/button';
// import { Calendar, MessageSquare, List, Users, User } from 'lucide-react';
// import { useEventContext } from '@/contexts/EventContext';
// import { motion, AnimatePresence } from 'framer-motion';
// import { supabase } from '@/integrations/supabase/client';
// import { USERNAME_KEY } from '@/types/chatTypes';
// import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// import EventCalendar from '@/components/EventCalendar';
// import EventForm from '@/components/EventForm';
// import { setupService } = '@/services/setupService';
// import { toast } from '@/hooks/use-toast';
// import UsernameDialog from '@/components/chat/UsernameDialog';
// import ProfileEditor from '@/components/users/ProfileEditor';
// import UserDirectory from '@/components/users/UserDirectory';
// import { useUserProfile } from '@/hooks/chat/useUserProfile';
// import { messageService } from '@/services/messageService';
// import { eventChatService } from '@/services/eventChatService';
// import EventChatWindow from '@/components/event-chat/EventChatWindow';

const ChatPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('view') as 'ai' | 'community' || 'ai';
  
  const [activeView, setActiveView] = useState<'ai' | 'community'>(initialView);

  // === EXTREME TEST: MINIMAL CHAT INPUT PROPS ===
  const [testInput, setTestInput] = useState('');
  const handleTestInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTestInput(e.target.value);
  };
  const handleTestSendMessage = async () => {
    if (testInput.trim()) {
      console.log('Test message sent (absolute minimum):', testInput);
      setTestInput('');
    }
  };
  const handleTestKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTestSendMessage();
    }
  };

  const testInputRef = useRef<HTMLTextAreaElement>(null); // Dedicated ref for the minimal test

  const chatInputProps = {
    input: testInput,
    setInput: setTestInput,
    handleSendMessage: handleTestSendMessage,
    isTyping: false,
    onKeyDown: handleTestKeyDown,
    onChange: handleTestInputChange,
    isHeartActive: false,
    handleHeartClick: () => {},
    globalQueries: [],
    toggleRecentQueries: () => {},
    inputRef: testInputRef, // Use the dedicated test ref
    onAddEvent: () => {},
    showAnimatedPrompts: false,
    activeChatModeValue: activeView, // Pass active view for correct placeholder/styling in ChatInput
    activeCategory: 'test',
    onCategoryChange: () => {},
    onJoinEventChat: () => {},
    placeholder: activeView === 'community' ? 'ULTRA-MINIMAL-TEST-INPUT...' : 'Minimal AI Input...'
  };
  // === END EXTREME TEST CHAT INPUT PROPS ===


  // Alle anderen Zustände und useEffects sind konzeptuell entfernt für diesen extremen Test,
  // da die Rendering-Logik unten vereinfacht ist.
  // Dies bedeutet keine externen Datenabrufe, keine Abonnements, keine anderen Effekte, die laufen.


  return (
    <Layout
      hideFooter={true}
      activeView={activeView}
      setActiveView={setActiveView}
      // Pass minimum required props to Layout
      handleOpenUserDirectory={() => console.log('User directory toggled')} // Dummy function
      setIsEventListSheetOpen={() => console.log('Event list toggled')} // Dummy function
      newMessagesCount={0} // Force 0
      newEventsCount={0} // Force 0
      chatInputProps={chatInputProps} // Use our extreme test chatInputProps
    >
      {/* Inhaltsbereich basierend auf activeView */}
      {activeView === 'community' ? (
        <div className="container mx-auto px-2 md:px-4 flex flex-col h-[calc(100vh-48px)] !mt-0 !pt-0">
          <div className="flex-grow rounded-lg overflow-hidden border border-black flex flex-col bg-black">
            <div className="flex-grow relative flex items-center justify-center text-gray-500">
              Dies ist der extrem minimierte Community Chat Testbereich.
            </div>
          </div>
        </div>
      ) : (
        // Für den AI-Modus können wir ihn ebenfalls minimal halten oder die ursprüngliche Einrichtung beibehalten, wenn sie in Ordnung ist.
        // Für diesen Test konzentrieren wir uns auf den Community-Chat, daher kann der AI-Teil auch Standard oder minimal sein.
        <div className="container mx-auto px-2 md:px-4 flex flex-col h-[calc(100vh-48px)] !mt-0 !pt-0">
          <div className="flex-grow rounded-lg overflow-hidden border border-black flex flex-col bg-black">
            <div className="flex-grow relative flex items-center justify-center text-gray-500">
              Dies ist der AI Chat Testbereich (minimal).
            </div>
          </div>
        </div>
      )}
      
      {/* Alle Sheets und Dialoge werden in dieser vereinfachten Rückgabe nicht direkt gerendert,
          ihr Zustand wird nicht verwaltet, und sie sollten keine Re-Renders verursachen. */}
      {/* <Sheet ... /> */}
      {/* <ProfileEditor ... /> */}
      {/* <EventChatWindow ... /> */}
    </Layout>
  );
};

export default ChatPage;