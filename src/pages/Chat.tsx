import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layouts/Layout';
import EventChatBot from '@/components/EventChatBot';
import LiveTicker from '@/components/LiveTicker';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, List, Users, User } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY } from '@/types/chatTypes';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import EventCalendar from '@/components/EventCalendar';
import EventForm from '@/components/EventForm';
import { setupService } from '@/services/setupService';
import { toast } from '@/hooks/use-toast';
import UsernameDialog from '@/components/chat/UsernameDialog';
import ProfileEditor from '@/components/users/ProfileEditor';
import UserDirectory from '@/components/users/UserDirectory';
import { useUserProfile } from '@/hooks/chat/useUserProfile';

const ChatPage = () => {
  const [activeView, setActiveView] = useState<'ai' | 'community'>('ai');
  const [isAddEventSheetOpen, setIsAddEventSheetOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [username, setUsername] = useState<string>('');
  const {
    events
  } = useEventContext();
  const {
    currentUser,
    userProfile,
    refetchProfile
  } = useUserProfile();

  // Function to show add event modal
  const handleAddEvent = () => {
    setIsAddEventSheetOpen(true);
  };

  // Function to toggle community view - this switches the mode in the same window
  const handleToggleCommunity = () => {
    setActiveView(prev => prev === 'community' ? 'ai' : 'community');
  };

  // Function to open user directory
  const handleOpenUserDirectory = () => {
    // For now, just close the directory - can be extended later
    setIsUserDirectoryOpen(true);
  };

  // Function to handle user selection from directory
  const handleSelectUser = (user: any) => {
    // For now, just close the directory - can be extended later
    setIsUserDirectoryOpen(false);
  };

  // Updated function for profile completion
  const handleProfileUpdate = async () => {
    // Refresh the profile immediately to ensure we have the latest data
    await refetchProfile();
    if (userProfile) {
      setUsername(userProfile.username);
      toast({
        title: "Willkommen " + userProfile.username + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
    }
  };

  // WhatsApp community link - Updated with the actual WhatsApp community link
  const whatsAppLink = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";

  // Enable realtime messaging when component mounts and ensure default group exists
  useEffect(() => {
    // Handle username initialization safely
    try {
      if (typeof window !== 'undefined') {
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        if (storedUsername) {
          setUsername(storedUsername);
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    const setupDatabase = async () => {
      try {
        // Ensure the default group exists
        await setupService.ensureDefaultGroupExists();

        // Enable realtime for chat_messages table
        console.log('Setting up realtime subscription for chat_messages table');

        // Direct approach - create a channel and enable realtime
        const channel = supabase.channel('realtime_setup').on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        }, () => {
          // Empty callback - we just want to ensure the channel is created
        }).subscribe();

        // Keep the channel open for a moment to ensure subscription is registered
        await new Promise(resolve => setTimeout(resolve, 500));

        // Then remove it to avoid having too many open channels
        supabase.removeChannel(channel);
        console.log('Realtime subscription initialized');
      } catch (error) {
        console.error('Exception in enabling Realtime:', error);
        toast({
          title: "Verbindungsfehler",
          description: "Es konnte keine Verbindung zum Chat hergestellt werden.",
          variant: "destructive"
        });
      } finally {
        // Mark page as loaded even if there were errors
        setIsPageLoaded(true);
      }
    };
    setupDatabase();
  }, [refetchProfile]);

  // Check if we're on mobile for responsive design adjustments
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    // Check if we need to refresh the profile when the component mounts
    refetchProfile();
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [refetchProfile]);

  // Show loading state while initializing
  if (!isPageLoaded) {
    return (
      <>
        {/* LiveTicker fixed at the very top */}
        <div className="fixed top-0 left-0 w-full z-50 bg-black h-6">
          <LiveTicker events={events} />
        </div>
        <Layout hideFooter={true}>
          <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-64px)] mt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
              <p className="text-lg font-medium">Lade Chat...</p>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      {/* LiveTicker fixed at the very top */}
      <div className="fixed top-0 left-0 w-full z-50 bg-black h-6">
        <LiveTicker events={events} />
      </div>
      <Layout
        hideFooter={true}
        activeView={activeView}
        setActiveView={setActiveView}
        handleOpenUserDirectory={handleOpenUserDirectory}
        setIsEventListSheetOpen={setIsEventListSheetOpen}
      >
        <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-64px-24px)] mt-[24px]">
          {/* Remove the button bar since buttons are now in header */}
          
          <div className="flex-grow rounded-lg overflow-hidden border border-black flex flex-col bg-black">
            <div className="flex-grow relative">
              <EventChatBot 
                fullPage={true} 
                onAddEvent={handleAddEvent} 
                onToggleCommunity={handleToggleCommunity} 
                activeChatMode={activeView} 
                setActiveChatMode={setActiveView}
                hideButtons={true}
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
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto max-h-[80vh]">
              <EventCalendar defaultView="list" />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* User Directory Sheet */}
        <Sheet open={isUserDirectoryOpen} onOpenChange={setIsUserDirectoryOpen}>
          <SheetContent className="sm:max-w-lg overflow-hidden">
            <SheetHeader>
              <SheetTitle>Benutzer</SheetTitle>
              <SheetDescription>
                Entdecke andere Community-Mitglieder
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto max-h-[80vh]">
              <UserDirectory 
                open={isUserDirectoryOpen}
                onOpenChange={setIsUserDirectoryOpen}
                onSelectUser={handleSelectUser}
                currentUsername={username}
              />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Replace UsernameDialog with ProfileEditor */}
        <ProfileEditor open={isProfileEditorOpen} onOpenChange={setIsProfileEditorOpen} currentUser={userProfile} onProfileUpdate={handleProfileUpdate} />
      </Layout>
    </>
  );
};

export default ChatPage;