// src/pages/Chat.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { messageService } from '@/services/messageService';
import { eventChatService } from '@/services/eventChatService';
import EventChatWindow from '@/components/event-chat/EventChatWindow';
import { createCitySpecificGroupId } from '@/utils/groupIdUtils';
import { AVATAR_KEY } from '@/types/chatTypes';

const ChatPage = () => {
  // Get view mode from URL search params or navigation state
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('view') as 'ai' | 'community' || 'ai';
  
  const [activeView, setActiveView] = useState<'ai' | 'community'>(initialView);
  const [isAddEventSheetOpen, setIsAddEventSheetOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  // Chat bot reference to get input props - memoized to prevent re-renders
  const [chatInputProps, setChatInputProps] = useState<any>(null);
  
  // Memoize chatInputProps to prevent unnecessary re-renders
  const memoizedChatInputProps = useMemo(() => chatInputProps, [chatInputProps]);
  
  const {
    events,
    refreshEvents,
    selectedCity
  } = useEventContext();
  const {
    currentUser,
    userProfile,
    refetchProfile
  } = useUserProfile();

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const lastReadMessageTimestamps = useRef<Map<string, string>>(new Map());
  const messageSubscriptionChannelRef = useRef<any>(null);
  
  // Event chat window state
  const [eventChatWindow, setEventChatWindow] = useState<{
    eventId: string;
    eventTitle: string;
    isOpen: boolean;
  } | null>(null);

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
    setIsUserDirectoryOpen(true);
  };

  // Function to handle user selection from directory
  const handleSelectUser = (user: any) => {
    setIsUserDirectoryOpen(false);
  };

  // Function to handle joining event chat
  const handleJoinEventChat = async (eventId: string, eventTitle: string) => {
    try {
      const groupId = await eventChatService.joinEventChat(eventId, eventTitle);
      
      if (groupId) {
        // Open event chat window
        setEventChatWindow({
          eventId,
          eventTitle,
          isOpen: true
        });
        
        toast({
          title: "Event Chat beigetreten",
          description: `Du bist dem Chat für "${eventTitle}" beigetreten`,
          variant: "default"
        });
      } else {
        toast({
          title: "Fehler",
          description: "Event Chat konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error joining event chat:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive"
      });
    }
  };

  // Function to close event chat window
  const handleCloseEventChat = () => {
    setEventChatWindow(null);
  };

  // Function to handle poll creation - memoized to prevent re-renders
  const handleCreatePoll = useCallback(async (poll: { question: string; options: string[] }) => {
    const username = localStorage.getItem(USERNAME_KEY);
    const communityGroupId = createCitySpecificGroupId('ausgehen', selectedCity);
    
    console.log('Chat.tsx: handleCreatePoll called with:', poll);
    console.log('Chat.tsx: username:', username);
    console.log('Chat.tsx: communityGroupId:', communityGroupId);
    
    if (!username) {
      console.error('Chat.tsx: No username available');
      return;
    }

    try {
      // Get user avatar from localStorage
      const avatar = localStorage.getItem(AVATAR_KEY) || null;
      console.log('Chat.tsx: avatar:', avatar);
      
      // Create poll message
      const pollMessage = {
        group_id: communityGroupId,
        sender: username,
        avatar: avatar,
        text: `📊 ${poll.question}`,
        poll_question: poll.question,
        poll_options: JSON.stringify(poll.options), // Convert to JSON string for jsonb column
        poll_votes: null // Initialize as null for jsonb column
      };

      console.log('Chat.tsx: Creating poll with message:', pollMessage);
      console.log('Chat.tsx: poll_options type:', typeof pollMessage.poll_options);
      console.log('Chat.tsx: poll_votes value:', pollMessage.poll_votes);

      // Send to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([pollMessage])
        .select();

      if (error) {
        console.error('Chat.tsx: Detailed Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        toast({
          title: "Fehler beim Erstellen der Umfrage",
          description: `${error.message} ${error.code ? `(Code: ${error.code})` : ''}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Chat.tsx: Poll created successfully:', data);
      toast({
        title: "Erfolg",
        description: "Umfrage erstellt!",
        variant: "default"
      });
    } catch (error) {
      console.error('Chat.tsx: Error in handleCreatePoll:', error);
      toast({
        title: "Fehler", 
        description: "Fehler beim Erstellen der Umfrage",
        variant: "destructive"
      });
    }
  }, [selectedCity]);

  // Updated function for profile completion
  const handleProfileUpdate = async () => {
    const profile = await refetchProfile();
    if (profile) {
      toast({
        title: "Willkommen " + profile.username + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
      fetchUnreadMessageCount();
    }
  };

  // WhatsApp community link
  const whatsAppLink = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";

  // Enable realtime messaging when component mounts and ensure default group exists
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await setupService.ensureDefaultGroupExists();
        console.log('Default group ensured.');

        await fetchUnreadMessageCount();

        messageSubscriptionChannelRef.current = supabase
          .channel('public:chat_messages')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
            if (payload.new && payload.new.sender !== currentUser) {
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
      if (messageSubscriptionChannelRef.current) {
        supabase.removeChannel(messageSubscriptionChannelRef.current);
      }
    };
  }, [currentUser]);

  const fetchUnreadMessageCount = async () => {
    if (!currentUser || currentUser === 'Gast') {
      setUnreadMessageCount(0);
      return;
    }

    try {
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

  // Effect to update unread message count when active view changes - with proper dependencies
  const hasMarkedAsRead = useRef(false);
  
  useEffect(() => {
    if (activeView === 'community' && !hasMarkedAsRead.current) {
      hasMarkedAsRead.current = true;
      setUnreadMessageCount(0);
      const markAllAsRead = async () => {
        if (currentUser && currentUser !== 'Gast') {
          try {
            const allMessages = await messageService.fetchMessages(messageService.DEFAULT_GROUP_ID);
            const unreadMessageIds = allMessages.filter(msg => 
              msg.user_name !== currentUser && (!msg.read_by || !msg.read_by.includes(currentUser))
            ).map(msg => msg.id);
            if (unreadMessageIds.length > 0) {
              console.log(`Marking ${unreadMessageIds.length} messages as read in Chat.tsx for user: ${currentUser}`);
              await messageService.markMessagesAsRead(messageService.DEFAULT_GROUP_ID, unreadMessageIds, currentUser);
            }
          } catch (error) {
            console.error('Error marking all messages as read:', error);
          }
        }
      };
      markAllAsRead();
    } else if (activeView !== 'community') {
      // Reset flag when leaving community view
      hasMarkedAsRead.current = false;
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
      <Layout 
        hideFooter={true}
        activeView={activeView}
        setActiveView={setActiveView}
        handleOpenUserDirectory={handleOpenUserDirectory}
        setIsEventListSheetOpen={setIsEventListSheetOpen}
        newMessagesCount={unreadMessageCount}
        newEventsCount={0}
        chatInputProps={memoizedChatInputProps}
      >
        <div className="flex flex-col h-screen">
          <EventChatBot 
            fullPage={true} 
            onAddEvent={handleAddEvent} 
            onToggleCommunity={handleToggleCommunity} 
            activeChatMode={activeView} 
            setActiveChatMode={setActiveView}
            hideButtons={true}
            onChatInputPropsChange={setChatInputProps}
            onJoinEventChat={handleJoinEventChat}
            onCreatePoll={handleCreatePoll}
          />
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
                currentUsername={currentUser}
              />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Replace UsernameDialog with ProfileEditor */}
        <ProfileEditor open={isProfileEditorOpen} onOpenChange={setIsProfileEditorOpen} currentUser={userProfile} onProfileUpdate={handleProfileUpdate} />
        
        {/* Event Chat Window */}
        {eventChatWindow && (
          <EventChatWindow
            eventId={eventChatWindow.eventId}
            eventTitle={eventChatWindow.eventTitle}
            isOpen={eventChatWindow.isOpen}
            onClose={handleCloseEventChat}
          />
        )}
      </Layout>
    </>
  );
};

export default ChatPage;
