
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useEventContext } from '@/contexts/EventContext';
import { ChatGroup, USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import { toast } from '@/hooks/use-toast';
import UsernameDialog from '../chat/UsernameDialog';

import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { GroupSelector } from './GroupSelector';

// Extend the ChatGroup type to include displayName
interface ExtendedChatGroup extends ChatGroup {
  name: string;
  id: string;
  displayName?: string;
}

interface CalendarWithChatProps {
  defaultView?: "calendar" | "list";
}

const CalendarWithChat = ({ defaultView = "list" }: CalendarWithChatProps) => {
  const [showChat, setShowChat] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'calendar' | 'chat'>('calendar');
  const { events } = useEventContext();
  
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [groups, setGroups] = useState<ExtendedChatGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [newMessages, setNewMessages] = useState(0);
  const [newEvents, setNewEvents] = useState(0);
  const lastCheckedMessages = useRef(new Date());
  const lastCheckedEvents = useRef(new Date());

  // Initialize username from localStorage safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        setUsername(storedUsername || "");
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error reading username from localStorage:", error);
      setIsInitialized(true); // Still mark as initialized to avoid blocking UI
    }
  }, []);

  useEffect(() => {
    if (isInitialized && !username) {
      setIsUsernameModalOpen(true);
    } else if (isInitialized && username && !localStorage.getItem(AVATAR_KEY)) {
      try {
        localStorage.setItem(AVATAR_KEY, getInitials(username));
      } catch (error) {
        console.error("Error setting avatar in localStorage:", error);
      }
    }
  }, [username, isInitialized]);

  useEffect(() => {
    if (events.length > 0) {
      const recentEvents = events.filter(event => {
        const eventCreationTime = new Date();
        return eventCreationTime > lastCheckedEvents.current;
      });
      setNewEvents(recentEvents.length);
    }
  }, [events]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!username) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .gt('created_at', lastCheckedMessages.current.toISOString())
          .not('sender', 'eq', username);
        
        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setNewMessages(data.length);
        }
      } catch (error) {
        console.error('Error checking for new messages:', error);
      }
    };

    fetchUnreadMessages();
    
    const messagesChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        if (payload.new && payload.new.sender !== username) {
          setNewMessages(prev => prev + 1);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [username]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_groups')
          .select('*')
          .order('created_at', { ascending: true })
          .not('name', 'eq', 'LiebefeldBot')
          .not('name', 'eq', 'Liebefeld');
        
        if (error) {
          throw error;
        }

        // Swap the group names for display
        const processedData = data.map(group => {
          let displayName = group.name;
          
          // Swap the display names
          if (group.name.toLowerCase() === 'sport') {
            displayName = 'Ausgehen';
          } else if (group.name.toLowerCase() === 'ausgehen') {
            displayName = 'Sport';
          }
          
          return {
            ...group,
            displayName
          } as ExtendedChatGroup;
        });

        setGroups(processedData);
        
        // Find the Sport group and set it as default (but now it's labeled as "Ausgehen")
        if (data && data.length > 0) {
          const sportGroup = data.find(g => g.name.toLowerCase() === 'sport');
          
          if (sportGroup) {
            console.log('Setting Sport group (relabeled as Ausgehen) as default:', sportGroup.id);
            setActiveGroup(sportGroup.id);
          } else {
            console.log('Sport group not found, setting first group as default');
            setActiveGroup(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast({
          title: "Fehler beim Laden der Gruppen",
          description: "Die Gruppen konnten nicht geladen werden.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
  };
  
  const handleGroupSelect = (groupId: string) => {
    console.log('Group selected:', groupId);
    setActiveGroup(groupId);
  };
  
  const handleClickCalendar = () => {
    setActiveMobileView('calendar');
    setNewEvents(0);
    lastCheckedEvents.current = new Date();
  };
  
  const handleClickChat = () => {
    setActiveMobileView('chat');
    setShowChat(true);
    setNewMessages(0);
    lastCheckedMessages.current = new Date();
  };

  // Get the correct display name for the active group
  const activeGroupObj = groups.find(g => g.id === activeGroup);
  const activeGroupName = activeGroupObj ? (activeGroupObj.displayName || activeGroupObj.name) : "Gruppe wählen";
  
  // If still loading and not initialized, show loading state
  if (isLoading && !isInitialized) {
    return <LoadingState />;
  }
  
  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <DesktopLayout 
        showChat={showChat}
        setShowChat={setShowChat}
        handleClickChat={handleClickChat}
        activeGroup={activeGroup}
        activeGroupName={activeGroupName}
        username={username}
        setIsUsernameModalOpen={setIsUsernameModalOpen}
        newMessages={newMessages}
        groups={groups}
        handleGroupSelect={handleGroupSelect}
        defaultView={defaultView}
      />
      
      {/* Mobile Layout */}
      <MobileLayout 
        activeMobileView={activeMobileView}
        handleClickCalendar={handleClickCalendar}
        handleClickChat={handleClickChat}
        newEvents={newEvents}
        newMessages={newMessages}
        username={username}
        setIsUsernameModalOpen={setIsUsernameModalOpen}
        activeGroup={activeGroup}
        activeGroupName={activeGroupName}
        groups={groups}
        handleGroupSelect={handleGroupSelect}
        defaultView={defaultView}
      />
      
      <UsernameDialog 
        isOpen={isUsernameModalOpen} 
        onOpenChange={setIsUsernameModalOpen} 
        onUsernameSet={handleUsernameSet} 
      />
    </div>
  );
};

// Loading component extracted
const LoadingState = () => (
  <div className="min-h-[400px] bg-black text-white flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2Icon className="h-8 w-8 animate-spin text-red-500" />
      <p className="text-lg font-medium">Lade Gruppen...</p>
    </div>
  </div>
);

// Export the Loader2 icon from lucide-react
import { Loader2 as Loader2Icon } from 'lucide-react';

export default CalendarWithChat;
