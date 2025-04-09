
import React, { useState, useRef, useEffect } from 'react';
import EventCalendar from './EventCalendar';
import GroupChat from './GroupChat';
import { Button } from '@/components/ui/button';
import { useEventContext } from '@/contexts/EventContext';
import { X, MessageSquare, Users, Loader2, ChevronDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/hooks/use-toast';
import UsernameDialog from './chat/UsernameDialog';
import { ChatGroup, GROUP_CATEGORIES, USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials, getCategoryColor } from '@/utils/chatUIUtils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);
  const [newMessages, setNewMessages] = useState(0);
  const [newEvents, setNewEvents] = useState(0);
  const lastCheckedMessages = useRef(new Date());
  const lastCheckedEvents = useRef(new Date());

  useEffect(() => {
    if (!username) {
      setIsUsernameModalOpen(true);
    } else if (!localStorage.getItem(AVATAR_KEY)) {
      localStorage.setItem(AVATAR_KEY, getInitials(username));
    }
  }, [username]);

  // Check for new events
  useEffect(() => {
    if (events.length > 0) {
      const recentEvents = events.filter(event => 
        new Date(event.created_at) > lastCheckedEvents.current
      );
      setNewEvents(recentEvents.length);
    }
  }, [events]);

  // Check for new messages
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
    
    // Subscribe to real-time messages
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
        let query = supabase
          .from('chat_groups')
          .select('*')
          .order('created_at', { ascending: true })
          .not('name', 'eq', 'LiebefeldBot')
          .not('name', 'eq', 'Liebefeld'); // Exclude Liebefeld group
        
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }
        
        const { data, error } = await query;
        
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
  }, [activeGroup, selectedCategory]);

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
  };
  
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setActiveGroup(""); // Reset active group when changing category
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
  
  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
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
            <h2 className="text-lg font-bold text-white bg-red-500 rounded-full px-4 py-1">Kalender</h2>
            {!showChat && (
              <Button 
                onClick={handleClickChat} 
                className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 shadow-lg relative"
              >
                <span>Community Chat</span>
                {newMessages > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                    {newMessages}
                  </Badge>
                )}
              </Button>
            )}
          </div>
          <div className="h-full flex-grow overflow-hidden border border-gray-700 rounded-lg">
            <EventCalendar defaultView={defaultView} />
          </div>
        </div>
        
        {showChat ? (
          <div className="w-2/3 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white bg-red-500 rounded-full px-4 py-1">Community Chat</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChat(false)}
                className="h-8 w-8 p-0 bg-gray-800 text-white hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4">
              {username && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 bg-gray-800 border border-gray-700">
                      <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                      <AvatarFallback className="bg-red-500 text-white">{getInitials(username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-white">{username}</div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsUsernameModalOpen(true)}
                        className="p-0 h-auto text-xs text-gray-400 hover:text-white"
                      >
                        Ändern
                      </Button>
                    </div>
                  </div>
                  
                  {/* Category filter dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="text-white bg-gray-800 hover:bg-gray-700 border border-gray-700">
                        {selectedCategory || "Alle Gruppen"} <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-700 text-white">
                      <DropdownMenuLabel>Kategorie wählen</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        className={cn(
                          "hover:bg-gray-800 cursor-pointer", 
                          !selectedCategory && "bg-gray-800"
                        )}
                        onClick={() => handleCategorySelect(null)}
                      >
                        Alle anzeigen
                      </DropdownMenuItem>
                      {GROUP_CATEGORIES.map(category => (
                        <DropdownMenuItem 
                          key={category} 
                          className={cn(
                            "cursor-pointer hover:bg-gray-800",
                            selectedCategory === category && "bg-gray-800"
                          )}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              
              <Collapsible open={isGroupsOpen} onOpenChange={setIsGroupsOpen} className="space-y-2">
                <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
                  <h4 className="text-sm font-semibold text-white pl-2">
                    {selectedCategory ? selectedCategory : "Alle Gruppen"} ({groups.length})
                  </h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-white">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
                    <TabsList className="mb-2 w-full h-auto p-1 flex flex-wrap justify-start bg-gray-800 border border-gray-700">
                      {groups.map((group) => (
                        <TabsTrigger 
                          key={group.id} 
                          value={group.id} 
                          className="px-4 py-2 flex items-center gap-1 text-white data-[state=active]:bg-red-500 data-[state=active]:text-white"
                        >
                          <Users className="h-4 w-4" />
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {groups.map((group) => (
                      <TabsContent key={group.id} value={group.id} className="border border-gray-700 rounded-lg overflow-hidden">
                        <div className="h-[calc(100vh-320px)] min-h-[400px]">
                          <GroupChat compact={false} groupId={group.id} groupName={group.name} />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleClickChat} 
            className="fixed right-4 bottom-20 bg-white text-black hover:bg-gray-200 rounded-full shadow-lg relative"
            size="icon"
          >
            <MessageSquare className="h-5 w-5" />
            {newMessages > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                {newMessages}
              </Badge>
            )}
          </Button>
        )}
      </div>
      
      {/* Mobile Layout - Tabbed - Default to Calendar */}
      <div className="md:hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm w-full" role="group">
            <Button
              variant={activeMobileView === 'calendar' ? 'default' : 'outline'} 
              onClick={handleClickCalendar}
              className={cn(
                "rounded-l-md rounded-r-none flex-1 relative",
                activeMobileView === 'calendar' ? "bg-white text-black" : "bg-gray-800 text-white border-gray-700"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Kalender
              {newEvents > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {newEvents}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeMobileView === 'chat' ? 'default' : 'outline'} 
              onClick={handleClickChat}
              className={cn(
                "rounded-r-md rounded-l-none flex-1 relative",
                activeMobileView === 'chat' ? "bg-white text-black" : "bg-gray-800 text-white border-gray-700"
              )}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Community
              {newMessages > 0 && activeMobileView !== 'chat' && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {newMessages}
                </Badge>
              )}
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
                {/* Mobile category dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="text-white bg-gray-800 hover:bg-gray-700 border border-gray-700">
                      {selectedCategory || "Alle Gruppen"} <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-700 text-white">
                    <DropdownMenuLabel>Kategorie wählen</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-gray-800 cursor-pointer", 
                        !selectedCategory && "bg-gray-800"
                      )}
                      onClick={() => handleCategorySelect(null)}
                    >
                      Alle anzeigen
                    </DropdownMenuItem>
                    {GROUP_CATEGORIES.map(category => (
                      <DropdownMenuItem 
                        key={category} 
                        className={cn(
                          "cursor-pointer hover:bg-gray-800",
                          selectedCategory === category && "bg-gray-800"
                        )}
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Avatar className="h-8 w-8 ml-2 bg-gray-800 border border-gray-700" onClick={() => setIsUsernameModalOpen(true)}>
                  <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                  <AvatarFallback className="bg-red-500 text-white">{getInitials(username)}</AvatarFallback>
                </Avatar>
              </div>
              
              {/* Groups in mobile view */}
              <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
                <TabsList className="mb-2 w-full h-auto p-1 flex flex-wrap justify-start bg-gray-800 border border-gray-700">
                  {groups.map((group) => (
                    <TabsTrigger 
                      key={group.id} 
                      value={group.id} 
                      className="px-4 py-2 flex items-center gap-1 text-white data-[state=active]:bg-red-500 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4" />
                      {group.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {groups.map((group) => (
                  <div 
                    key={group.id} 
                    className={cn(
                      "h-[calc(100vh-280px)] min-h-[400px] border border-gray-700 rounded-lg overflow-hidden",
                      activeGroup === group.id ? 'block' : 'hidden'
                    )}
                  >
                    <GroupChat compact={false} groupId={group.id} groupName={group.name} />
                  </div>
                ))}
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white">
              <p className="mb-4 text-center">Bitte erstelle einen Benutzernamen, um am Chat teilzunehmen</p>
              <Button onClick={() => setIsUsernameModalOpen(true)} className="bg-red-500 hover:bg-red-600 text-white">
                Benutzernamen erstellen
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <UsernameDialog 
        isOpen={isUsernameModalOpen} 
        onOpenChange={setIsUsernameModalOpen} 
        onUsernameSet={handleUsernameSet} 
      />
    </div>
  );
};

export default CalendarWithChat;
