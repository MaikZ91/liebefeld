
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarNavbar from "@/components/CalendarNavbar";
import { Send, Users, User, Clock, Loader2, Image, ThumbsUp, Smile, Paperclip, MessageSquare, Check, CheckCheck, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase, type ChatMessage, type MessageReaction } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEventContext } from "@/contexts/EventContext"; 

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
  // Generate a random seed to get different avatars
  const seed = Math.random().toString(36).substring(2, 8);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

const USERNAME_KEY = "community_chat_username";
const AVATAR_KEY = "community_chat_avatar";

// Common emoji reactions
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  
  const { events } = useEventContext();

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

        // Mark all messages as read by this user
        if (username && data && data.length > 0) {
          const messagesToUpdate = data.filter(msg => 
            msg.sender !== username && 
            (!msg.read_by || !msg.read_by.includes(username))
          );
          
          if (messagesToUpdate.length > 0) {
            for (const msg of messagesToUpdate) {
              const readBy = msg.read_by || [];
              await supabase
                .from('chat_messages')
                .update({ read_by: [...readBy, username] })
                .eq('id', msg.id);
            }
          }
        }

        // Ensure the data conforms to the ChatMessage type
        if (data) {
          const typedMessages = data.map(msg => ({
            ...msg,
            reactions: msg.reactions as MessageReaction[] || [],
            read_by: msg.read_by as string[] || []
          }));

          setMessages(prev => ({
            ...prev,
            [activeGroup]: typedMessages
          }));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${activeGroup}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        
        // Mark message as read if we're the recipient
        if (username && newMessage.sender !== username) {
          const readBy = newMessage.read_by || [];
          supabase
            .from('chat_messages')
            .update({ read_by: [...readBy, username] })
            .eq('id', newMessage.id);
        }
        
        setMessages(prev => ({
          ...prev,
          [activeGroup]: [...(prev[activeGroup] || []), newMessage]
        }));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${activeGroup}`
      }, (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setMessages(prev => {
          const groupMessages = [...(prev[activeGroup] || [])];
          const index = groupMessages.findIndex(msg => msg.id === updatedMessage.id);
          if (index !== -1) {
            groupMessages[index] = updatedMessage;
          }
          return {
            ...prev,
            [activeGroup]: groupMessages
          };
        });
      })
      .subscribe();

    // Setup typing indicators channel
    const typingChannel = supabase
      .channel(`typing:${activeGroup}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username, avatar, isTyping } = payload;
        
        if (username === localStorage.getItem(USERNAME_KEY)) return;
        
        setTypingUsers(prev => {
          const groupTypingUsers = [...(prev[activeGroup] || [])];
          
          if (isTyping) {
            // Add or update typing user
            const existingIndex = groupTypingUsers.findIndex(u => u.username === username);
            if (existingIndex >= 0) {
              groupTypingUsers[existingIndex] = {
                ...groupTypingUsers[existingIndex],
                lastTyped: new Date()
              };
            } else {
              groupTypingUsers.push({
                username,
                avatar,
                lastTyped: new Date()
              });
            }
          } else {
            // Remove typing user
            const filteredUsers = groupTypingUsers.filter(u => u.username !== username);
            return {
              ...prev,
              [activeGroup]: filteredUsers
            };
          }
          
          return {
            ...prev,
            [activeGroup]: groupTypingUsers
          };
        });
      })
      .subscribe();

    // Clean up expired typing indicators every 2 seconds
    const typingInterval = setInterval(() => {
      setTypingUsers(prev => {
        const groupTypingUsers = [...(prev[activeGroup] || [])];
        // Remove users who haven't typed in the last 3 seconds
        const now = new Date();
        const filteredUsers = groupTypingUsers.filter(user => {
          return now.getTime() - user.lastTyped.getTime() < 3000;
        });
        
        if (filteredUsers.length !== groupTypingUsers.length) {
          return {
            ...prev,
            [activeGroup]: filteredUsers
          };
        }
        return prev;
      });
    }, 2000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      clearInterval(typingInterval);
    };
  }, [activeGroup, username]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeGroup]);

  const handleSendMessage = async (eventData?: any) => {
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length && !eventData) || !username || !activeGroup) return;

    try {
      setIsSending(true);
      
      let mediaUrl = undefined;
      
      // Upload file if present
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${activeGroup}/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('chat_media')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: urlData } = supabase
          .storage
          .from('chat_media')
          .getPublicUrl(filePath);
          
        mediaUrl = urlData.publicUrl;
      }
      
      // Format message text with event data if provided
      let messageText = newMessage;
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageText = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${newMessage}`;
      }

      const newChatMessage = {
        group_id: activeGroup,
        sender: username,
        text: messageText,
        avatar: localStorage.getItem(AVATAR_KEY) || getRandomAvatar(),
        media_url: mediaUrl,
        read_by: [username], // Initially only read by sender
        reactions: []
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(newChatMessage);

      if (error) {
        throw error;
      }

      setNewMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      await supabase
        .channel(`typing:${activeGroup}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem(AVATAR_KEY),
            isTyping: false
          }
        });
        
      setIsTyping(false);
      setIsEventSelectOpen(false);
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

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      supabase
        .channel(`typing:${activeGroup}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem(AVATAR_KEY),
            isTyping: true
          }
        });
    }
    
    // Clear existing timeout and set a new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        supabase
          .channel(`typing:${activeGroup}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              username,
              avatar: localStorage.getItem(AVATAR_KEY),
              isTyping: false
            }
          });
        setIsTyping(false);
      }
    }, 2000);
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

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      // Find the message in the current state
      const message = messages[activeGroup]?.find(m => m.id === messageId);
      if (!message) return;
      
      // Update reactions
      const reactions = message.reactions || [];
      let updated = false;
      
      // Check if this emoji is already used
      const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // Check if this user already reacted with this emoji
        const users = reactions[existingReactionIndex].users;
        const userIndex = users.indexOf(username);
        
        if (userIndex >= 0) {
          // Remove user from this reaction
          users.splice(userIndex, 1);
          if (users.length === 0) {
            // Remove the reaction if no users left
            reactions.splice(existingReactionIndex, 1);
          }
        } else {
          // Add user to this reaction
          users.push(username);
        }
        updated = true;
      } else {
        // Add new reaction
        reactions.push({
          emoji,
          users: [username]
        });
        updated = true;
      }
      
      if (updated) {
        await supabase
          .from('chat_messages')
          .update({ reactions })
          .eq('id', messageId);
      }
      
      setSelectedMessageId(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Fehler beim Hinzufügen der Reaktion",
        description: "Die Reaktion konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleShareEvent = () => {
    setIsEventSelectOpen(true);
  };

  const handleEventSelect = (eventId: string) => {
    const selectedEvent = events.find(event => event.id === eventId);
    if (selectedEvent) {
      handleSendMessage(selectedEvent);
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
                                <AvatarImage src={message.avatar || undefined} alt={message.sender} />
                                <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className="flex flex-col">
                              <div className={`max-w-[280px] p-3 rounded-lg space-y-1 ${
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
                                <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                                
                                {/* Display media if available */}
                                {message.media_url && (
                                  <div className="mt-2">
                                    <img 
                                      src={message.media_url} 
                                      alt="Shared media" 
                                      className="rounded-md max-w-full max-h-[200px] object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Display reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 ml-2">
                                  {message.reactions.map((reaction, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className={`px-1.5 py-0 h-6 text-xs rounded-full ${
                                        reaction.users.includes(username) ? 'bg-primary/20' : 'bg-muted'
                                      }`}
                                      onClick={() => handleAddReaction(message.id, reaction.emoji)}
                                    >
                                      {reaction.emoji} {reaction.users.length}
                                    </Button>
                                  ))}
                                </div>
                              )}
                              
                              {/* Message status (read receipts) */}
                              {message.sender === username && (
                                <div className="flex justify-end mt-1">
                                  {message.read_by && message.read_by.length > 1 ? (
                                    <CheckCheck className="h-3 w-3 text-primary" />
                                  ) : (
                                    <Check className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col">
                              {message.sender === username && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                                  <AvatarFallback>{getInitials(username)}</AvatarFallback>
                                </Avatar>
                              )}
                              
                              {/* Reaction button */}
                              <Popover open={selectedMessageId === message.id} onOpenChange={(open) => {
                                if (open) setSelectedMessageId(message.id);
                                else setSelectedMessageId(null);
                              }}>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 rounded-full mt-1"
                                  >
                                    <Smile className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                  <div className="flex gap-1">
                                    {EMOJI_REACTIONS.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        className="px-1.5 py-0 h-8 text-lg hover:bg-muted"
                                        onClick={() => handleAddReaction(message.id, emoji)}
                                      >
                                        {emoji}
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing indicators */}
                        {typingUsers[group.id]?.length > 0 && (
                          <div className="flex items-start gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage 
                                  src={typingUsers[group.id][0].avatar} 
                                  alt={typingUsers[group.id][0].username} 
                                />
                                <AvatarFallback>
                                  {getInitials(typingUsers[group.id][0].username)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-muted p-2 rounded-full text-xs">
                                <div className="flex space-x-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messageEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                  
                  <CardFooter>
                    {username ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <Textarea 
                            placeholder="Schreibe eine Nachricht..." 
                            value={newMessage}
                            onChange={handleMessageChange}
                            onKeyDown={handleKeyDown}
                            className="min-h-[50px] flex-grow resize-none"
                          />
                          <div className="flex flex-col gap-2">
                            <Button 
                              onClick={handleFileUpload} 
                              variant="outline"
                              size="icon"
                              type="button"
                              className="rounded-full"
                              title="Bild anhängen"
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={handleShareEvent} 
                              variant="outline"
                              size="icon"
                              type="button"
                              className="rounded-full"
                              title="Event teilen"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => handleSendMessage()} 
                              disabled={(!newMessage.trim() && !fileInputRef.current?.files?.length) || isSending}
                              size="icon"
                              className="rounded-full"
                            >
                              {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={() => handleSendMessage()}
                          />
                        </div>
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
      
      {/* Event selection popover */}
      <Popover open={isEventSelectOpen} onOpenChange={setIsEventSelectOpen}>
        <PopoverContent className="w-80 p-0 max-h-[300px] overflow-y-auto" side="top" align="start">
          <div className="p-3 bg-muted">
            <h3 className="font-medium mb-2">Event auswählen</h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {events.length > 0 ? (
                events
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(event => (
                    <div
                      key={event.id}
                      className="cursor-pointer hover:bg-muted/80 rounded p-2 transition-colors"
                      onClick={() => handleEventSelect(event.id)}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {event.date} • {event.time}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-sm text-muted-foreground p-2">Keine Events verfügbar</div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Groups;
