
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layouts/Layout';
import EventChatBot from '@/components/EventChatBot';
import ChatGroup from '@/components/chat/ChatGroup';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageCircle, Users, List, Calendar } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY } from '@/types/chatTypes';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import EventCalendar from '@/components/EventCalendar';
import EventForm from '@/components/EventForm';

// We need to map group names to actual UUIDs from the database
const GROUP_ID_MAPPING = {
  'ausgehen': '97a8062d-6225-4dac-b3c2-0680365c1e10',
  'sport': '6a7ed75f-4033-44a7-a478-b5703a19a7a9',
  'kreativität': '9f20c6c6-a23c-4d12-983c-63889a916ba1'
};

const ChatPage = () => {
  const [activeView, setActiveView] = useState<'ai' | 'community'>('ai');
  const [activeCommunityGroup, setActiveCommunityGroup] = useState<string>('ausgehen');
  const [isAddEventSheetOpen, setIsAddEventSheetOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);
  
  // Function to show add event modal
  const handleAddEvent = () => {
    setIsAddEventSheetOpen(true);
  };

  // Get username from localStorage for chat
  const [username, setUsername] = useState<string>(() => 
    typeof window !== 'undefined' ? localStorage.getItem(USERNAME_KEY) || 'Gast' : 'Gast'
  );

  // Enable realtime messaging when component mounts
  useEffect(() => {
    const enableRealtime = async () => {
      try {
        console.log('Setting up realtime subscription for chat_messages table');
        
        // Direct approach - create a channel and enable realtime
        const channel = supabase
          .channel('realtime_setup')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'chat_messages'
          }, () => {
            // Empty callback - we just want to ensure the channel is created
          })
          .subscribe();
        
        // Keep the channel open for a moment to ensure subscription is registered
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Then remove it to avoid having too many open channels
        supabase.removeChannel(channel);
        
        console.log('Realtime subscription initialized');
      } catch (error) {
        console.error('Exception in enabling Realtime:', error);
      }
    };

    enableRealtime();
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

  // Get the actual UUID for the selected group
  const getGroupUuid = (groupName: string) => {
    return GROUP_ID_MAPPING[groupName as keyof typeof GROUP_ID_MAPPING] || '';
  };

  return (
    <Layout hideFooter={true}>
      <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-red-500">Liebefield Chat</h1>
          
          <div className="flex gap-2">
            {/* Add Event Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddEvent}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">Event hinzufügen</span>
            </Button>
            
            {/* View Events Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEventListSheetOpen(true)}
              className="flex items-center gap-1"
            >
              <List className="h-4 w-4" />
              <span className="hidden md:inline">Events anzeigen</span>
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
                  {['ausgehen', 'sport', 'kreativität'].map((group) => (
                    <Button
                      key={group}
                      variant={activeCommunityGroup === group ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setActiveCommunityGroup(group)}
                      className={`mx-1 ${activeCommunityGroup === group ? 'bg-[#9b87f5] text-white' : ''}`}
                    >
                      {group === 'ausgehen' ? 'Ausgehen' : 
                       group === 'sport' ? 'Sport' : 
                       group === 'kreativität' ? 'Kreativität' : 
                       group}
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
                      groupId={getGroupUuid(activeCommunityGroup)} 
                      groupName={activeCommunityGroup === 'ausgehen' ? 'Ausgehen' : 
                                 activeCommunityGroup === 'sport' ? 'Sport' : 
                                 activeCommunityGroup === 'kreativität' ? 'Kreativität' : 
                                 'Ausgehen'}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Add Event Sheet */}
      <Sheet open={isAddEventSheetOpen} onOpenChange={setIsAddEventSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Event hinzufügen</SheetTitle>
            <SheetDescription>
              Erstelle ein neues Event für die Community.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[80vh]">
            <EventForm onSuccess={() => setIsAddEventSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Event List Sheet */}
      <Sheet open={isEventListSheetOpen} onOpenChange={setIsEventListSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-hidden">
          <SheetHeader>
            <SheetTitle>Aktuelle Events</SheetTitle>
            <SheetDescription>
              Die aktuellen Events in deiner Region.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[80vh]">
            <EventCalendar defaultView="list" />
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default ChatPage;
