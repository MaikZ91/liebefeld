
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarNavbar from "@/components/CalendarNavbar";
import { Send, Users, Plus, UserPlus, User, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
  avatar?: string;
};

type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
  messages: Message[];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

const getRandomAvatar = () => {
  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom"
  ];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

const USERNAME_KEY = "community_chat_username";

const Groups = () => {
  const [activeGroup, setActiveGroup] = useState<string>("ausgehen");
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(USERNAME_KEY) || "";
  });
  const [tempUsername, setTempUsername] = useState("");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [groups, setGroups] = useState<Record<string, Group>>({
    ausgehen: {
      id: "ausgehen",
      name: "Ausgehen",
      description: "Gemeinsam ausgehen, feiern und Spaß haben",
      members: 42,
      messages: [
        { id: 1, text: "Hey, was geht heute Abend?", sender: "Max", timestamp: new Date(2023, 7, 5, 18, 30), avatar: getRandomAvatar() },
        { id: 2, text: "Ich bin für alles offen! Wer hat noch Lust?", sender: "Lisa", timestamp: new Date(2023, 7, 5, 18, 35), avatar: getRandomAvatar() }
      ]
    },
    sport: {
      id: "sport",
      name: "Sport",
      description: "Zusammen Sport treiben und fit bleiben",
      members: 28,
      messages: [
        { id: 1, text: "Morgen 18 Uhr Laufen im Park?", sender: "Thomas", timestamp: new Date(2023, 7, 6, 10, 15), avatar: getRandomAvatar() },
        { id: 2, text: "Bin dabei!", sender: "Anna", timestamp: new Date(2023, 7, 6, 10, 20), avatar: getRandomAvatar() }
      ]
    },
    kreativ: {
      id: "kreativ",
      name: "Kreativität",
      description: "Kreative Projekte zusammen gestalten",
      members: 18,
      messages: [
        { id: 1, text: "Hat jemand Lust auf einen Malkurs am Wochenende?", sender: "Julia", timestamp: new Date(2023, 7, 4, 14, 10), avatar: getRandomAvatar() },
        { id: 2, text: "Ich wäre interessiert! Wo findet das statt?", sender: "Mark", timestamp: new Date(2023, 7, 4, 14, 25), avatar: getRandomAvatar() }
      ]
    }
  });

  // Check for username on component mount
  useEffect(() => {
    if (!username) {
      setIsUsernameModalOpen(true);
    }
  }, [username]);

  // Subscribe to real-time updates for new messages
  useEffect(() => {
    // Set up a channel to simulate real-time updates
    const interval = setInterval(() => {
      const randomResponses = [
        "Das klingt super! Ich bin dabei.",
        "Hat jemand einen Vorschlag für einen guten Treffpunkt?",
        "Wer kommt noch alles mit?",
        "Kann leider nicht, aber viel Spaß euch!",
        "Hat jemand Erfahrung damit? Würde gerne mehr darüber erfahren."
      ];
      
      const randomSenders = ["Alex", "Sarah", "Tim", "Sophia", "David"];
      
      // 10% chance of getting a simulated response
      if (Math.random() < 0.1 && username) {
        const randomResponse = randomResponses[Math.floor(Math.random() * randomResponses.length)];
        const randomSender = randomSenders[Math.floor(Math.random() * randomSenders.length)];
        
        // Add message to the active group
        const updatedGroups = { ...groups };
        updatedGroups[activeGroup].messages.push({
          id: Date.now(),
          text: randomResponse,
          sender: randomSender,
          timestamp: new Date(),
          avatar: getRandomAvatar()
        });
        
        setGroups(updatedGroups);
      }
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(interval);
  }, [groups, activeGroup, username]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groups[activeGroup]?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !username) return;

    const updatedGroups = { ...groups };
    
    updatedGroups[activeGroup].messages.push({
      id: Date.now(),
      text: newMessage,
      sender: username,
      timestamp: new Date(),
      avatar: localStorage.getItem("userAvatar") || getRandomAvatar()
    });

    setGroups(updatedGroups);
    setNewMessage("");
    
    toast({
      title: "Nachricht gesendet",
      description: "Deine Nachricht wurde an die Gruppe gesendet.",
    });
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
      localStorage.setItem("userAvatar", userAvatar);
      
      setIsUsernameModalOpen(false);
      
      toast({
        title: "Willkommen " + tempUsername + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
    }
  };

  const createNewGroup = () => {
    if (!newGroupName.trim() || !newGroupDescription.trim()) return;
    
    const groupId = newGroupName.toLowerCase().replace(/\s+/g, '-');
    
    if (groups[groupId]) {
      toast({
        title: "Gruppe existiert bereits",
        description: "Bitte wähle einen anderen Namen.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedGroups = { ...groups };
    updatedGroups[groupId] = {
      id: groupId,
      name: newGroupName,
      description: newGroupDescription,
      members: 1, // Start with the creator
      messages: [
        {
          id: Date.now(),
          text: `Willkommen in der neuen Gruppe "${newGroupName}"!`,
          sender: "System",
          timestamp: new Date()
        }
      ]
    };
    
    setGroups(updatedGroups);
    setActiveGroup(groupId);
    setIsCreatingGroup(false);
    setNewGroupName("");
    setNewGroupDescription("");
    
    toast({
      title: "Gruppe erstellt",
      description: `Deine Gruppe "${newGroupName}" wurde erfolgreich erstellt.`,
      variant: "success"
    });
  };

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
                <AvatarImage src={localStorage.getItem("userAvatar") || undefined} alt={username} />
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
                {Object.values(groups).map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <Button onClick={() => setIsCreatingGroup(true)} variant="outline" className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Neue Gruppe
              </Button>
            </div>
            
            {Object.entries(groups).map(([id, group]) => (
              <TabsContent key={id} value={id}>
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {group.description} • <span className="inline-flex items-center"><Users className="h-4 w-4 mr-1" />{group.members} Mitglieder</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-0">
                    <ScrollArea className="h-[400px] rounded-md p-4 mb-4 bg-muted/20">
                      <div className="flex flex-col space-y-3">
                        {group.messages.map(message => (
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
                                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              <div className="text-sm">{message.text}</div>
                            </div>
                            
                            {message.sender === username && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={localStorage.getItem("userAvatar") || undefined} alt={username} />
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
                          disabled={!newMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsUsernameModalOpen(true)} className="w-full">
                        <UserPlus className="h-4 w-4 mr-2" />
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
      
      {/* Create Group Modal */}
      <Drawer open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
        <DrawerContent>
          <div className="px-4 py-8 max-w-md mx-auto">
            <DrawerHeader>
              <DrawerTitle className="text-center text-xl font-semibold">Neue Gruppe erstellen</DrawerTitle>
              <DrawerDescription className="text-center">
                Starte deine eigene Community zu einem Thema deiner Wahl
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-4 space-y-4">
              <Input
                placeholder="Gruppenname"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mb-2"
                autoFocus
              />
              
              <Textarea
                placeholder="Beschreibung der Gruppe"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="min-h-[100px]"
              />
              
              <Button 
                onClick={createNewGroup} 
                disabled={!newGroupName.trim() || !newGroupDescription.trim()} 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Gruppe erstellen
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Groups;
