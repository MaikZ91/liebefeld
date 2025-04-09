
import React, { useState, useRef, useEffect } from 'react';
import EventCalendar from './EventCalendar';
import GroupChat from './GroupChat';
import { Button } from '@/components/ui/button';
import { useEventContext } from '@/contexts/EventContext';
import { X, MessageSquare, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from '@/hooks/use-toast';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type ChatGroup = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

type TypingUser = {
  username: string;
  avatar?: string;
  lastTyped: Date;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

const getRandomAvatar = () => {
  const seed = Math.random().toString(36).substring(2, 8);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

const USERNAME_KEY = "community_chat_username";
const AVATAR_KEY = "community_chat_avatar";

interface CalendarWithChatProps {
  defaultView?: "calendar" | "list";
}

const CalendarWithChat = ({ defaultView = "list" }: CalendarWithChatProps) => {
  const [showChat, setShowChat] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'calendar' | 'chat'>('calendar');
  const { events } = useEventContext();
  
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(USERNAME_KEY) || "";
  });
  const [tempUsername, setTempUsername] = useState("");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});

  useEffect(() => {
    if (!username) {
      setIsUsernameModalOpen(true);
    } else if (!localStorage.getItem(AVATAR_KEY)) {
      const userAvatar = getRandomAvatar();
      localStorage.setItem(AVATAR_KEY, userAvatar);
    }
  }, [username]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_groups')
          .select('*')
          .order('created_at', { ascending: true })
          .not('name', 'eq', 'LiebefeldBot')
          .not('name', 'eq', 'Liebefeld'); // Exclude Liebefeld group
        
        if (error) {
          throw error;
        }

        setGroups(data);
        if (data && data.length > 0 && !activeGroup) {
          setActiveGroup(data[0].id);
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
  }, [activeGroup]);

  const saveUsername = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername);
      localStorage.setItem(USERNAME_KEY, tempUsername);
      
      const userAvatar = getRandomAvatar();
      localStorage.setItem(AVATAR_KEY, userAvatar);
      
      setIsUsernameModalOpen(false);
      
      toast({
        title: "Willkommen " + tempUsername + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Lade Gruppen...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Desktop Layout - Side by Side */}
      <div className="hidden md:flex gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          showChat ? "w-1/3" : "w-full"
        )}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Kalender</h2>
            {!showChat && (
              <Button 
                onClick={() => setShowChat(true)} 
                className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
              >
                <span>Community Chat</span>
              </Button>
            )}
          </div>
          <div className="h-full flex-grow overflow-hidden border rounded-lg">
            <EventCalendar defaultView={defaultView} />
          </div>
        </div>
        
        {showChat ? (
          <div className="w-2/3 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Community Chat</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChat(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4">
              {username && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                      <AvatarFallback>{getInitials(username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{username}</div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsUsernameModalOpen(true)}
                        className="p-0 h-auto text-xs text-muted-foreground"
                      >
                        Ändern
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
                <TabsList className="mb-2 w-full h-auto p-1 flex flex-wrap justify-start">
                  {groups.map((group) => (
                    <TabsTrigger key={group.id} value={group.id} className="px-4 py-2 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {groups.map((group) => (
                  <TabsContent key={group.id} value={group.id} className="border rounded-lg overflow-hidden">
                    <div className="h-[calc(100vh-320px)] min-h-[400px]">
                      <GroupChat compact={false} groupId={group.id} groupName={group.name} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setShowChat(true)} 
            className="fixed right-4 bottom-20 bg-primary text-white rounded-full shadow-lg"
            size="icon"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Mobile Layout - Tabbed - Default to Calendar */}
      <div className="md:hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm w-full" role="group">
            <Button
              variant={activeMobileView === 'calendar' ? 'default' : 'outline'} 
              onClick={() => setActiveMobileView('calendar')}
              className="rounded-l-md rounded-r-none flex-1"
            >
              Kalender
            </Button>
            <Button
              variant={activeMobileView === 'chat' ? 'default' : 'outline'} 
              onClick={() => setActiveMobileView('chat')}
              className="rounded-r-md rounded-l-none flex-1"
            >
              Community
            </Button>
          </div>
        </div>
        
        <div className={cn(
          "flex-grow transition-all duration-300",
          activeMobileView === 'calendar' ? 'block' : 'hidden'
        )}>
          <EventCalendar defaultView={defaultView} />
        </div>
        
        <div className={cn(
          "flex-grow transition-all duration-300 overflow-hidden",
          activeMobileView === 'chat' ? 'block' : 'hidden'
        )}>
          {username ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
                  <TabsList className="mb-2 w-full h-auto p-1 flex flex-wrap justify-start">
                    {groups.map((group) => (
                      <TabsTrigger key={group.id} value={group.id} className="px-4 py-2 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                <Avatar className="h-8 w-8 ml-2" onClick={() => setIsUsernameModalOpen(true)}>
                  <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                  <AvatarFallback>{getInitials(username)}</AvatarFallback>
                </Avatar>
              </div>
              
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className={cn(
                    "h-[calc(100vh-280px)] min-h-[400px] border rounded-lg overflow-hidden",
                    activeGroup === group.id ? 'block' : 'hidden'
                  )}
                >
                  <GroupChat compact={false} groupId={group.id} groupName={group.name} />
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="mb-4 text-center">Bitte erstelle einen Benutzernamen, um am Chat teilzunehmen</p>
              <Button onClick={() => setIsUsernameModalOpen(true)}>
                Benutzernamen erstellen
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Drawer open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
        <DrawerContent className="p-4 sm:p-6">
          <DrawerHeader>
            <DrawerTitle>Wähle deinen Benutzernamen</DrawerTitle>
            <DrawerDescription>Dieser Name wird in den Gruppenchats angezeigt.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Dein Benutzername" 
              value={tempUsername} 
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
            />
            <Button onClick={saveUsername} disabled={!tempUsername.trim()} className="w-full">
              Speichern
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CalendarWithChat;
