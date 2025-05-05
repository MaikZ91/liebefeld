import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layouts/Layout';
import EventChatBot from '@/components/EventChatBot';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageCircle, MessageSquare, List, Calendar, Link, Users } from 'lucide-react';
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
import LiveTicker from '@/components/LiveTicker';

const ChatPage = () => {
  const [activeView, setActiveView] = useState<'ai' | 'community'>('ai');
  const [isAddEventSheetOpen, setIsAddEventSheetOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const { events } = useEventContext();
  
  // Function to show add event modal
  const handleAddEvent = () => {
    setIsAddEventSheetOpen(true);
  };

  // Function to toggle community view
  const handleToggleCommunity = () => {
    setActiveView(prev => prev === 'community' ? 'ai' : 'community');
  };

  // Get username from localStorage for chat
  const [username, setUsername] = useState<string>(() => 
    typeof window !== 'undefined' ? localStorage.getItem(USERNAME_KEY) || 'Gast' : 'Gast'
  );

  // WhatsApp community link - Updated with the actual WhatsApp community link
  const whatsAppLink = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";

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

  return (
    <Layout hideFooter={true}>
      <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-64px)]">
        {/* Add LiveTicker above chat header */}
        <div className="mb-2 border border-gray-800/50 rounded-md overflow-hidden bg-black">
          <LiveTicker events={events} />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-red-500">Liebefield Chat</h1>
          
          <div className="flex gap-2">
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
          <div className="flex-grow relative">
            <EventChatBot 
              fullPage={true} 
              onAddEvent={handleAddEvent} 
              onToggleCommunity={handleToggleCommunity} 
            />
          </div>
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
