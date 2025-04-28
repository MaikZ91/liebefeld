
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layouts/Layout';
import EventChatBot from '@/components/EventChatBot';
import ChatGroup from '@/components/chat/ChatGroup';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageCircle, Users, Calendar } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { Event } from '@/types/eventTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '@/services/chatService';
import { USERNAME_KEY } from '@/types/chatTypes';

const ChatPage = () => {
  const [activeView, setActiveView] = useState<'ai' | 'community'>('ai');
  const [activeCommunityGroup, setActiveCommunityGroup] = useState<string>('Ausgehen');
  const { events } = useEventContext();

  // Function to handle the chatbot query from external components
  const handleChatQuery = (query: string) => {
    if (typeof window !== 'undefined' && window.chatbotQuery) {
      window.chatbotQuery(query);
    }
  };

  // Function to show add event modal from the existing implementation
  const handleAddEvent = () => {
    // Implementation would come from the existing Plus button logic
    console.log('Open add event modal');
    // If there's a global state management for modals, you would trigger it here
    if (typeof window !== 'undefined' && window.triggerAddEvent) {
      window.triggerAddEvent();
    }
  };

  // Get username from localStorage for chat
  const [username, setUsername] = useState<string>(() => 
    typeof window !== 'undefined' ? localStorage.getItem(USERNAME_KEY) || 'Gast' : 'Gast'
  );

  useEffect(() => {
    // Enable realtime messaging when component mounts
    chatService.enableRealtime();
  }, []);

  // Check if we're on mobile for responsive design adjustments
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-120px)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-red-500">Liebefield Chat</h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddEvent}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">Event hinzufügen</span>
            </Button>
          </div>
        </div>
        
        <div className="flex-grow rounded-lg overflow-hidden border border-gray-800 flex flex-col bg-black">
          <Tabs defaultValue="ai" className="w-full h-full flex flex-col" onValueChange={(val) => setActiveView(val as 'ai' | 'community')}>
            <div className="border-b border-gray-800 bg-gray-900/30">
              <TabsList className="h-12 w-full bg-transparent">
                <TabsTrigger 
                  value="ai" 
                  className="flex-1 data-[state=active]:bg-black/50 data-[state=active]:text-red-500"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>KI Chat</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="community" 
                  className="flex-1 data-[state=active]:bg-black/50 data-[state=active]:text-[#9b87f5]"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Community</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="ai" className="flex-grow overflow-hidden flex flex-col mt-0 pt-0">
              <div className="flex-grow relative">
                <EventChatBot fullPage={true} />
              </div>
            </TabsContent>
            
            <TabsContent value="community" className="flex-grow overflow-hidden flex flex-col mt-0 pt-0">
              <div className="border-b border-gray-800 bg-gray-900/20">
                <div className="flex overflow-x-auto py-2 px-4">
                  {['Ausgehen', 'Sport', 'Kreativität'].map((group) => (
                    <Button
                      key={group}
                      variant={activeCommunityGroup === group ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveCommunityGroup(group)}
                      className={`mx-1 ${activeCommunityGroup === group ? 'bg-[#9b87f5] text-white' : ''}`}
                    >
                      {group}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCommunityGroup}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <ChatGroup 
                      groupId={activeCommunityGroup.toLowerCase()} 
                      groupName={activeCommunityGroup}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
