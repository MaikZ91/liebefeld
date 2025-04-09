
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Smile, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from 'sonner';
import { supabase, type ChatMessage, type MessageReaction } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from '@/lib/utils';

interface GroupChatProps {
  compact?: boolean;
}

type TypingUser = {
  username: string;
  avatar?: string;
  lastTyped: Date;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const USERNAME_KEY = "community_chat_username";
const AVATAR_KEY = "community_chat_avatar";

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

const GroupChat = ({ compact = false }: GroupChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(USERNAME_KEY) || "";
  });
  const [tempUsername, setTempUsername] = useState("");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [group, setGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Check for username
  useEffect(() => {
    if (!username) {
      setIsUsernameModalOpen(true);
    } else if (!localStorage.getItem(AVATAR_KEY)) {
      const userAvatar = getRandomAvatar();
      localStorage.setItem(AVATAR_KEY, userAvatar);
    }
  }, [username]);

  // Fetch or create the default group
  useEffect(() => {
    const fetchOrCreateDefaultGroup = async () => {
      setIsLoading(true);
      try {
        // First check if Liebefeld group exists
        const { data: existingGroups, error: fetchError } = await supabase
          .from('chat_groups')
          .select('*')
          .eq('name', 'Liebefeld');
        
        if (fetchError) throw fetchError;
        
        if (existingGroups && existingGroups.length > 0) {
          console.log('Found existing Liebefeld group:', existingGroups[0]);
          setGroup(existingGroups[0].id);
        } else {
          // Create the default group if it doesn't exist
          const { data: newGroup, error: createError } = await supabase
            .from('chat_groups')
            .insert({
              name: 'Liebefeld',
              description: 'Öffentlicher Chat für Liebefeld Community',
              created_by: 'System'
            })
            .select();
          
          if (createError) throw createError;
          
          if (newGroup && newGroup.length > 0) {
            console.log('Created new Liebefeld group:', newGroup[0]);
            setGroup(newGroup[0].id);
          }
        }
      } catch (error) {
        console.error('Error setting up default group:', error);
        toast.error("Fehler beim Laden des Chats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateDefaultGroup();
  }, []);

  // Fetch messages and subscribe to updates
  useEffect(() => {
    if (!group) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('group_id', group)
          .order('created_at', { ascending: true });
        
        if (error) throw error;

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

        if (data) {
          const typedMessages = data.map(msg => ({
            ...msg,
            reactions: msg.reactions as MessageReaction[] || [],
            read_by: msg.read_by as string[] || []
          }));

          setMessages(typedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    const messagesChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${group}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        
        if (username && newMessage.sender !== username) {
          const readBy = newMessage.read_by || [];
          supabase
            .from('chat_messages')
            .update({ read_by: [...readBy, username] })
            .eq('id', newMessage.id);
        }
        
        setMessages(prev => [...prev, newMessage]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${group}`
      }, (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setMessages(prev => {
          const groupMessages = [...prev];
          const index = groupMessages.findIndex(msg => msg.id === updatedMessage.id);
          if (index !== -1) {
            groupMessages[index] = updatedMessage;
          }
          return groupMessages;
        });
      })
      .subscribe();

    const typingChannel = supabase
      .channel(`typing:${group}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username, avatar, isTyping } = payload;
        
        if (username === localStorage.getItem(USERNAME_KEY)) return;
        
        setTypingUsers(prev => {
          if (isTyping) {
            const existingIndex = prev.findIndex(u => u.username === username);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                lastTyped: new Date()
              };
              return updated;
            } else {
              return [...prev, {
                username,
                avatar,
                lastTyped: new Date()
              }];
            }
          } else {
            return prev.filter(u => u.username !== username);
          }
        });
      })
      .subscribe();

    const typingInterval = setInterval(() => {
      setTypingUsers(prev => {
        const now = new Date();
        const filteredUsers = prev.filter(user => {
          return now.getTime() - user.lastTyped.getTime() < 3000;
        });
        
        if (filteredUsers.length !== prev.length) {
          return filteredUsers;
        }
        return prev;
      });
    }, 2000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      clearInterval(typingInterval);
    };
  }, [group, username]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !username || !group) return;

    try {
      setIsSending(true);
      
      let mediaUrl = undefined;
      
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${group}/${fileName}`;
        
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

      const newChatMessage = {
        group_id: group,
        sender: username,
        text: newMessage,
        avatar: localStorage.getItem(AVATAR_KEY) || getRandomAvatar(),
        media_url: mediaUrl,
        read_by: [username],
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
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      await supabase
        .channel(`typing:${group}`)
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
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Nachricht konnte nicht gesendet werden");
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

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!group) return;
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      supabase
        .channel(`typing:${group}`)
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
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        supabase
          .channel(`typing:${group}`)
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
      
      const userAvatar = getRandomAvatar();
      localStorage.setItem(AVATAR_KEY, userAvatar);
      
      setIsUsernameModalOpen(false);
      
      toast.success(`Willkommen ${tempUsername}!`);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!group) return;
    
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      const reactions = message.reactions || [];
      let updated = false;
      
      const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        const users = reactions[existingReactionIndex].users;
        const userIndex = users.indexOf(username);
        
        if (userIndex >= 0) {
          users.splice(userIndex, 1);
          if (users.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          }
        } else {
          users.push(username);
        }
        updated = true;
      } else {
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
      toast.error("Reaktion konnte nicht hinzugefügt werden");
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full",
      compact ? "text-sm" : ""
    )}>
      <ScrollArea className="flex-grow px-3 py-2">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${message.sender === username 
                ? "justify-end" 
                : "justify-start"
              }`}
            >
              {message.sender !== username && (
                <Avatar className={cn("flex-shrink-0", compact ? "h-7 w-7" : "h-8 w-8")}>
                  <AvatarImage src={message.avatar || undefined} alt={message.sender} />
                  <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex flex-col max-w-[75%]">
                <div className={cn(
                  "p-2 rounded-lg",
                  compact ? "p-2" : "p-3",
                  message.sender === username 
                    ? "bg-primary text-white" 
                    : message.sender === "System"
                      ? "bg-secondary text-white italic"
                      : "bg-secondary text-white"
                )}>
                  <div className="flex justify-between items-center">
                    <div className={cn("font-medium", compact ? "text-xs" : "text-xs")}>
                      {message.sender}
                    </div>
                    <div className={cn("opacity-70", compact ? "text-[0.65rem]" : "text-xs")}>
                      {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className={cn("whitespace-pre-wrap text-white", compact ? "text-xs" : "text-sm")}>
                    {message.text}
                  </div>
                  
                  {message.media_url && (
                    <div className="mt-2">
                      <img 
                        src={message.media_url} 
                        alt="Shared media" 
                        className="rounded-md max-w-full max-h-[150px] object-contain"
                      />
                    </div>
                  )}
                </div>
                
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 ml-2">
                    {message.reactions.map((reaction, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className={`px-1.5 py-0 h-5 text-xs rounded-full ${
                          reaction.users.includes(username) ? 'bg-primary/20' : 'bg-muted'
                        }`}
                        onClick={() => handleAddReaction(message.id, reaction.emoji)}
                      >
                        {reaction.emoji} {reaction.users.length}
                      </Button>
                    ))}
                  </div>
                )}
                
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
                  <Avatar className={cn("flex-shrink-0", compact ? "h-7 w-7" : "h-8 w-8")}>
                    <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                    <AvatarFallback>{getInitials(username)}</AvatarFallback>
                  </Avatar>
                )}
                
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
          
          {typingUsers.length > 0 && (
            <div className="flex items-start gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Avatar className={cn("flex-shrink-0", compact ? "h-6 w-6" : "h-6 w-6")}>
                  <AvatarImage 
                    src={typingUsers[0].avatar} 
                    alt={typingUsers[0].username} 
                  />
                  <AvatarFallback>
                    {getInitials(typingUsers[0].username)}
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
      
      <div className="p-2 border-t">
        {username ? (
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Schreibe eine Nachricht..." 
              value={newMessage}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              className={cn("flex-grow", compact ? "h-9 text-sm" : "")}
            />
            <Button 
              onClick={handleFileUpload} 
              variant="outline"
              size="icon"
              type="button"
              className={cn("rounded-full", compact ? "h-9 w-9" : "")}
              title="Bild anhängen"
            >
              <Paperclip className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={() => {}}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isSending || !newMessage.trim()}
              className={cn("rounded-full", compact ? "h-9 w-9 p-0" : "")}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <Button onClick={() => setIsUsernameModalOpen(true)} variant="outline" size="sm">
              Anmelden um zu chatten
            </Button>
          </div>
        )}
      </div>
      
      <Drawer open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
        <DrawerContent className="p-4 sm:p-6">
          <DrawerHeader>
            <DrawerTitle>Wähle deinen Benutzernamen</DrawerTitle>
            <DrawerDescription>Dieser Name wird im Community-Chat angezeigt.</DrawerDescription>
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

export default GroupChat;
