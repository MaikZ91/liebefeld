
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarNavbar from "@/components/CalendarNavbar";
import { Send, Users, User, Clock, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ChatGroup = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

type ChatMessage = {
  id: string;
  group_id: string;
  sender: string;
  text: string;
  avatar?: string;
  created_at: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

const getRandomAvatar = () => {
  // Generate a random seed to get different avatars
  const seed = Math.random().toString(36).substring(2, 8);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

const USERNAME_KEY = "community_chat_username";
const AVATAR_KEY = "community_chat_avatar";

const Groups = () => {
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(USERNAME_KEY) || "";
  });
  const [tempUsername, setTempUsername] = useState("");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Check for username on component mount
  useEffect(() => {
    if (!username) {
      setIsUsernameModalOpen(true);
    } else if (!localStorage.getItem(AVATAR_KEY)) {
      // Generate and save avatar if username exists but no avatar
      const userAvatar = getRandomAvatar();
      localStorage.setItem(AVATAR_KEY, userAvatar);
    }
  }, [username]);

  // Fetch groups from Supabase
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_groups')
          .select('*')
          .order('created_at', { ascending: true });
        
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

  // Subscribe to real-time updates for chat messages
  useEffect(() => {
    if (!activeGroup) return;

    // Fetch existing messages for the active group
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('group_id', activeGroup)
          .order('created_at', { ascending: true });
        
        if (error) {
          throw error;
        }

        setMessages(prev => ({
          ...prev,
          [activeGroup]: data || []
        }));
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${activeGroup}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => ({
          ...prev,
          [activeGroup]: [...(prev[activeGroup] || []), newMessage]
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGroup]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeGroup]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !username || !activeGroup) return;

    try {
      setIsSending(true);
      
      const newChatMessage = {
        group_id: activeGroup,
        sender: username,
        text: newMessage,
        avatar: localStorage.getItem(AVATAR_KEY) || getRandomAvatar()
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(newChatMessage);

      if (error) {
        throw error;
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Deine Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const saveUsername = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername);
      localStorage.setItem(USERNAME_KEY, tempUsername);
      
      // Generate and store an avatar for this user
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Lade Gruppen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CalendarNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gruppen</h1>
            <p className="text-lg">Entdecke Gruppen in deiner Stadt und tausche dich mit Gleichgesinnten aus!</p>
          </div>
          
          {username && (
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                <AvatarFallback>{getInitials(username)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{username}</div>
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
          )}
        </div>
        
        <div className="flex justify-between mb-4">
          <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
            <div className="flex justify-between items-center">
              <TabsList className="mb-4">
                {groups.map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {groups.map((group) => (
              <TabsContent key={group.id} value={group.id}>
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {group.description} • <span className="inline-flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {/* Display member count based on unique senders */}
                        {messages[group.id] 
                          ? new Set(messages[group.id].map(msg => msg.sender)).size 
                          : 0} Mitglieder
                      </span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-0">
                    <ScrollArea className="h-[400px] rounded-md p-4 mb-4 bg-muted/20">
                      <div className="flex flex-col space-y-3">
                        {(messages[group.id] || []).map(message => (
                          <div 
                            key={message.id} 
                            className={`flex items-start gap-2 ${message.sender === username 
                              ? "justify-end" 
                              : "justify-start"
                            }`}
                          >
                            {message.sender !== username && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.avatar} alt={message.sender} />
                                <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={`max-w-[80%] p-3 rounded-lg space-y-1 ${
                              message.sender === username 
                                ? "bg-primary text-primary-foreground" 
                                : message.sender === "System"
                                  ? "bg-secondary text-secondary-foreground italic"
                                  : "bg-secondary text-secondary-foreground"
                            }`}>
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-xs">
                                  {message.sender}
                                </div>
                                <div className="text-xs opacity-70 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              <div className="text-sm">{message.text}</div>
                            </div>
                            
                            {message.sender === username && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                                <AvatarFallback>{getInitials(username)}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        <div ref={messageEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                  
                  <CardFooter>
                    {username ? (
                      <div className="w-full flex gap-2">
                        <Textarea 
                          placeholder="Schreibe eine Nachricht..." 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="min-h-[50px] flex-grow resize-none"
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!newMessage.trim() || isSending}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsUsernameModalOpen(true)} className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Benutzernamen erstellen zum Chatten
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      {/* Username Modal */}
      <Drawer open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
        <DrawerContent>
          <div className="px-4 py-8 max-w-md mx-auto">
            <DrawerHeader>
              <DrawerTitle className="text-center text-xl font-semibold">Wie möchtest du genannt werden?</DrawerTitle>
              <DrawerDescription className="text-center">
                Dein Nutzername wird in den Gruppenchats angezeigt
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-4 space-y-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{tempUsername ? getInitials(tempUsername) : "?"}</AvatarFallback>
                </Avatar>
              </div>
              
              <Input
                placeholder="Dein Name"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="text-center"
                autoFocus
              />
              
              <Button 
                onClick={saveUsername} 
                disabled={!tempUsername.trim()} 
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                {username ? "Namen ändern" : "Jetzt loschatten"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Groups;
