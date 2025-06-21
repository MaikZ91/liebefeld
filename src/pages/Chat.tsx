// src/pages/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { messageService } from '@/services/messageService'; // Import messageService

const ChatPage = () => {
  const [activeView, setActiveView] = useState<'ai' | 'community'>('ai');
  const [isAddEventSheetOpen, setIsAddEventSheetOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  const {
    events,
    refreshEvents // Get refreshEvents to update event counts
  } = useEventContext();
  const {
    currentUser,
    userProfile,
    refetchProfile
  } = useUserProfile();

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const lastReadMessageTimestamps = useRef<Map<string, string>>(new Map()); // Map to store last read timestamp per group
  const messageSubscriptionChannelRef = useRef<any>(null); // Ref for message subscription

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
    const profile = await refetchProfile();
    if (profile) {
      toast({
        title: "Willkommen " + profile.username + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
      // Re-fetch unread messages after username is set/updated
      fetchUnreadMessageCount();
    }
  };

  // WhatsApp community link - Updated with the actual WhatsApp community link
  const whatsAppLink = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";

  // Enable realtime messaging when component mounts and ensure default group exists
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await setupService.ensureDefaultGroupExists();
        console.log('Default group ensured.');

        // Fetch initial unread message count
        await fetchUnreadMessageCount();

        // Setup realtime listener for new messages
        messageSubscriptionChannelRef.current = supabase
          .channel('public:chat_messages')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
            if (payload.new && payload.new.sender !== currentUser) { // Only count messages from other users
              // Increment unread message count
              setUnreadMessageCount(prev => prev + 1);
            }
          })
          .subscribe();

        console.log('Realtime subscription for messages initialized.');
      } catch (error) {
        console.error('Exception in enabling Realtime or fetching unread messages:', error);
        toast({
          title: "Verbindungsfehler",
          description: "Es konnte keine Verbindung zum Chat hergestellt werden.",
          variant: "destructive"
        });
      } finally {
        setIsPageLoaded(true);
      }
    };

    setupDatabase();

    return () => {
      // Cleanup subscription on unmount
      if (messageSubscriptionChannelRef.current) {
        supabase.removeChannel(messageSubscriptionChannelRef.current);
      }
    };
  }, [currentUser]); // Depend on currentUser to re-subscribe if it changes

  const fetchUnreadMessageCount = async () => {
    if (!currentUser || currentUser === 'Gast') {
      setUnreadMessageCount(0);
      return;
    }

    try {
      // Get all messages and filter unread ones
      const allMessages = await messageService.fetchMessages(messageService.DEFAULT_GROUP_ID);
      const unreadCount = allMessages.filter(msg => 
        msg.user_name !== currentUser && (!msg.read_by || !msg.read_by.includes(currentUser))
      ).length;
      setUnreadMessageCount(unreadCount);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      setUnreadMessageCount(0);
    }
  };

  // Effect to update unread message count when active view changes
  useEffect(() => {
    if (activeView === 'community') {
      setUnreadMessageCount(0); // Reset count when entering community chat
      // Mark all messages as read for the current user in the default group
      const markAllAsRead = async () => {
        if (currentUser && currentUser !== 'Gast') {
          try {
            const allMessages = await messageService.fetchMessages(messageService.DEFAULT_GROUP_ID);
            const unreadMessageIds = allMessages.filter(msg => 
              msg.user_name !== currentUser && (!msg.read_by || !msg.read_by.includes(currentUser))
            ).map(msg => msg.id);
            if (unreadMessageIds.length > 0) {
              await messageService.markMessagesAsRead(messageService.DEFAULT_GROUP_ID, unreadMessageIds, currentUser);
            }
          } catch (error) {
            console.error('Error marking all messages as read:', error);
          }
        }
      };
      markAllAsRead();
    }
  }, [activeView, currentUser]);

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

  // Show loading state while initializing
  if (!isPageLoaded) {
    return (
      <>
        {/* LiveTicker ganz oben, über dem Header */}
        <div className="w-full bg-black">
          <LiveTicker events={events} />
        </div>
        <Layout hideFooter={true}>
          <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-64px)] items-center justify-center">
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
      {/* LiveTicker ganz oben, über dem Header */}
      <div className="w-full bg-black">
        <LiveTicker events={events} />
      </div>
      <Layout 
        hideFooter={true}
        activeView={activeView}
        setActiveView={setActiveView}
        handleOpenUserDirectory={handleOpenUserDirectory}
        setIsEventListSheetOpen={setIsEventListSheetOpen}
        newMessagesCount={unreadMessageCount} // Pass new messages count
        newEventsCount={0} // No new events tracking for now
      >
        <div className="container mx-auto py-4 px-2 md:px-4 flex flex-col h-[calc(100vh-64px)]">
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
            <SheetHeader> {/* Corrected: Removed self-closing tag here */}
              <SheetTitle>Benutzer</SheetTitle>
              <SheetDescription>
                Entdecke andere Community-Mitglieder
              </SheetDescription>
            </SheetHeader> {/* Corrected: Added explicit closing tag here */}
            <div className="mt-4 overflow-y-auto max-h-[80vh]">
              <UserDirectory 
                open={isUserDirectoryOpen}
                onOpenChange={setIsUserDirectoryOpen}
                onSelectUser={handleSelectUser}
                currentUsername={currentUser}
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
