
import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Paperclip, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY, AVATAR_KEY, TypingUser } from '@/types/chatTypes';
import { useEventContext } from '@/contexts/EventContext';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { groupFutureEventsByDate } from '@/utils/eventUtils';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/chatUIUtils';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';

interface ChatGroupProps {
  groupId: string;
  groupName: string;
}

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
}

const ChatGroup: React.FC<ChatGroupProps> = ({ groupId, groupName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const channelsRef = useRef<any[]>([]);
  
  const { events } = useEventContext();
  
  // Detect the group type based on name
  const isAusgehenGroup = groupName.toLowerCase() === 'ausgehen';
  const isSportGroup = groupName.toLowerCase() === 'sport';
  const isKreativitätGroup = groupName.toLowerCase() === 'kreativität';
  
  const isGroup = isAusgehenGroup || isSportGroup || isKreativitätGroup;
  
  // Get the group type
  const groupType = isAusgehenGroup ? 'ausgehen' : 
                   isSportGroup ? 'sport' : 
                   isKreativitätGroup ? 'kreativität' : 
                   'ausgehen';
  
  // Update messages ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Fetch messages on component mount and when group changes
  useEffect(() => {
    if (!groupId) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching messages for group: ${groupId}`);
        
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error('Error fetching messages:', error);
          setError(`Could not load messages: ${error.message}`);
          return;
        }
        
        console.log(`Fetched ${data?.length || 0} messages`);
        
        // Convert messages to expected format
        const formattedMessages: Message[] = (data || []).map(msg => ({
          id: msg.id,
          created_at: msg.created_at,
          content: msg.text,
          user_name: msg.sender,
          user_avatar: msg.avatar || '',
          group_id: msg.group_id,
        }));
        
        setMessages(formattedMessages);
        
        // Mark messages as read
        if (username && formattedMessages.length > 0) {
          const unreadMessages = formattedMessages.filter(msg => msg.user_name !== username);
          
          if (unreadMessages.length > 0) {
            for (const msg of unreadMessages) {
              await supabase
                .from('chat_messages')
                .update({ 
                  read_by: [...(msg.read_by || []), username]
                })
                .eq('id', msg.id);
            }
          }
        }
      } catch (err: any) {
        console.error('Error in fetchMessages:', err);
        setError(`An error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    setupRealtimeSubscriptions();
    
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [groupId, username]);
  
  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!groupId) return;
    
    console.log(`Setting up realtime subscriptions for group: ${groupId}`);
    
    // Message subscription (table changes)
    const messageChannel = supabase
      .channel(`messages:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('New message received:', payload);
        
        if (payload.new) {
          const msg = payload.new as any;
          const newMessage: Message = {
            id: msg.id,
            created_at: msg.created_at,
            content: msg.text,
            user_name: msg.sender,
            user_avatar: msg.avatar || '',
            group_id: msg.group_id
          };
          
          // Don't add duplicate messages
          setMessages(prevMessages => {
            if (prevMessages.some(m => m.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
          
          // Mark message as read if it's from someone else
          if (msg.sender !== username && username) {
            supabase
              .from('chat_messages')
              .update({ 
                read_by: [...(msg.read_by || []), username]
              })
              .eq('id', msg.id);
          }
        }
      })
      .subscribe();
    
    // Typing subscription
    const typingChannel = supabase
      .channel(`typing:${groupId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload && payload.payload.username !== username) {
          const typingUser = payload.payload;
          
          setTypingUsers(prev => {
            // Clone current typing list
            const currentUsers = [...prev];
            
            // Find existing user
            const existingIndex = currentUsers.findIndex(u => u.username === typingUser.username);
            
            if (typingUser.isTyping) {
              // Update or add user
              const user = {
                username: typingUser.username,
                avatar: typingUser.avatar,
                isTyping: true,
                lastTyped: new Date()
              };
              
              if (existingIndex >= 0) {
                currentUsers[existingIndex] = user;
              } else {
                currentUsers.push(user);
              }
            } else {
              // Remove user from list
              if (existingIndex >= 0) {
                currentUsers.splice(existingIndex, 1);
              }
            }
            
            return currentUsers;
          });
        }
      })
      .subscribe();
    
    channelsRef.current.push(messageChannel, typingChannel);
    
    // Interval to clean up typing indicators that have been inactive
    const typingInterval = setInterval(() => {
      setTypingUsers(prev => {
        const now = new Date();
        return prev.filter(user => {
          return user.lastTyped && now.getTime() - user.lastTyped.getTime() < 3000;
        });
      });
    }, 1000);
    
    // Store the interval ID for cleanup
    const intervalId = typingInterval;
    channelsRef.current.push({ isInterval: true, id: intervalId });
  };
  
  // Cleanup subscriptions
  const cleanupRealtimeSubscriptions = () => {
    console.log('Cleaning up subscriptions');
    
    channelsRef.current.forEach(channel => {
      if (channel.isInterval) {
        clearInterval(channel.id);
      } else if (channel) {
        supabase.removeChannel(channel);
      }
    });
    
    channelsRef.current = [];
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
  
  // Handle manual reconnection
  const handleReconnect = async () => {
    console.log('Manual reconnection triggered');
    setIsReconnecting(true);
    
    try {
      cleanupRealtimeSubscriptions();
      
      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-fetch messages and setup subscriptions
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        created_at: msg.created_at,
        content: msg.text,
        user_name: msg.sender,
        user_avatar: msg.avatar || '',
        group_id: msg.group_id,
      }));
      
      setMessages(formattedMessages);
      setupRealtimeSubscriptions();
      
      toast({
        title: "Reconnected",
        description: "Chat connection restored successfully",
      });
    } catch (err) {
      console.error('Reconnection failed:', err);
      setError('Reconnection failed. Please try again.');
      
      toast({
        title: "Reconnection failed",
        description: "Failed to restore chat connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReconnecting(false);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);
  
  // Format time for display
  const formatTime = (isoDateString: string): string => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 3600));
    const diffInDays = Math.floor(diff / (1000 * 3600 * 24));

    if (diffInMinutes < 1) {
      return 'jetzt';
    } else if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Minuten`;
    } else if (diffInHours < 24) {
      return `vor ${diffInHours} Stunden`;
    } else if (diffInDays === 1) {
      return 'gestern';
    } else if (diffInDays < 7) {
      return `vor ${diffInDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };
  
  // Handle sending messages
  const handleSubmit = async (e?: React.FormEvent, eventData?: any) => {
    if (e) {
      e.preventDefault();
    }
    
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length && !eventData) || !username || !groupId) {
      return;
    }
    
    try {
      setIsSending(true);
      
      // Handle file upload
      let mediaUrl = undefined;
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        // File upload logic would go here
        // This is a placeholder for now
      }
      
      // Format message with event data if present
      let messageText = newMessage.trim();
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageText = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${messageText}`;
      }
      
      // Create optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        created_at: new Date().toISOString(),
        content: messageText,
        user_name: username,
        user_avatar: localStorage.getItem(AVATAR_KEY) || '',
        group_id: groupId
      };
      
      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input 
      setNewMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Send message to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          sender: username,
          text: messageText,
          avatar: localStorage.getItem(AVATAR_KEY),
          media_url: mediaUrl,
          read_by: [username]
        })
        .select('id');
      
      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      // Reset typing state
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (isTyping) {
        // Create a new channel for typing updates
        const typingUpdateChannel = supabase.channel(`typing:${groupId}`);
        
        // Subscribe to the channel
        await typingUpdateChannel.subscribe();
        
        // Send the typing update
        await typingUpdateChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem(AVATAR_KEY),
            isTyping: false
          }
        });
        
        // Remove the channel after sending
        supabase.removeChannel(typingUpdateChannel);
        
        setIsTyping(false);
      }
      
      setIsEventSelectOpen(false);
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Show error toast
      toast({
        title: "Error sending message",
        description: err.message || "Your message couldn't be sent",
        variant: "destructive"
      });
      
      // Remove optimistic message if it failed
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle input change and typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Update typing status
    const isCurrentlyTyping = e.target.value.trim().length > 0;
    
    if (!isTyping && isCurrentlyTyping) {
      // Typing begins
      setIsTyping(true);
      
      // Create a new channel for typing updates
      const typingUpdateChannel = supabase.channel(`typing:${groupId}`);
      
      // Subscribe and send typing update
      typingUpdateChannel.subscribe().then(async () => {
        await typingUpdateChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem(AVATAR_KEY),
            isTyping: true
          }
        });
        
        // Remove the channel after sending
        supabase.removeChannel(typingUpdateChannel);
      });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        // Create a new channel for typing updates
        const typingUpdateChannel = supabase.channel(`typing:${groupId}`);
        
        // Subscribe and send typing update
        typingUpdateChannel.subscribe().then(async () => {
          await typingUpdateChannel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              username,
              avatar: localStorage.getItem(AVATAR_KEY),
              isTyping: false
            }
          });
          
          // Remove the channel after sending
          supabase.removeChannel(typingUpdateChannel);
        });
        
        setIsTyping(false);
      }
    }, 2000);
  };
  
  // Handle keydown (enter to submit)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Handle event sharing
  const handleShareEvent = () => {
    setIsEventSelectOpen(true);
    setEventSearchQuery('');
  };
  
  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    const selectedEvent = events.find(event => event.id === eventId);
    if (selectedEvent) {
      handleSubmit(undefined, selectedEvent);
    }
  };
  
  // Filter events based on search query
  const filteredEvents = events.filter(event => {
    if (!eventSearchQuery.trim()) return true;
    
    const query = eventSearchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query)) ||
      (event.location && event.location.toLowerCase().includes(query)) ||
      (event.category && event.category.toLowerCase().includes(query)) ||
      (event.date && event.date.toLowerCase().includes(query))
    );
  });
  
  // Group events by date
  const groupedEvents = groupFutureEventsByDate(filteredEvents);
  
  return (
    <div className="flex flex-col h-full w-full">
      <ChatHeader 
        groupName={groupName}
        isReconnecting={isReconnecting}
        handleReconnect={handleReconnect}
        isGroup={isGroup}
      />
      
      <MessageList 
        messages={messages}
        loading={loading}
        error={error}
        username={username}
        typingUsers={typingUsers}
        formatTime={formatTime}
        isGroup={isGroup}
        groupType={groupType as any}
        chatBottomRef={chatBottomRef}
      />
      
      <div className={`${isGroup ? 'bg-[#1A1F2C]' : 'bg-gray-900'} p-4 border-t ${isGroup ? 'border-gray-800' : 'border-gray-700'}`}>
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2">
            <Textarea 
              placeholder="Schreibe eine Nachricht..." 
              value={newMessage}
              onChange={handleInputChange}
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
              <Popover 
                open={isEventSelectOpen} 
                onOpenChange={setIsEventSelectOpen}
              >
                <PopoverTrigger asChild>
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
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0 max-h-[400px] overflow-y-auto" 
                  side="top" 
                  align="end"
                  sideOffset={5}
                >
                  <div className="p-3 bg-muted border-b">
                    <h3 className="font-medium mb-2">Event auswählen</h3>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nach Events suchen..."
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        className="pl-8 bg-background"
                      />
                    </div>
                  </div>
                  <ScrollArea className="max-h-[320px]">
                    <div className="p-2">
                      {Object.keys(groupedEvents).length === 0 ? (
                        <div className="py-3 px-2 text-center text-muted-foreground text-sm">
                          Keine Events gefunden
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.keys(groupedEvents).sort().map(dateStr => {
                            const date = parseISO(dateStr);
                            return (
                              <div key={dateStr} className="mb-2">
                                <div className="sticky top-0 bg-primary text-white py-1.5 px-3 text-sm font-semibold rounded-md mb-1.5 shadow-sm">
                                  {format(date, 'EEEE, d. MMMM', { locale: de })}
                                </div>
                                <div className="space-y-1 pl-2">
                                  {groupedEvents[dateStr].map(event => (
                                    <Button
                                      key={event.id}
                                      variant="ghost"
                                      className="w-full justify-start text-left px-2 py-1.5 h-auto"
                                      onClick={() => handleEventSelect(event.id)}
                                    >
                                      <div>
                                        <div className="font-medium line-clamp-1">{event.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {event.time} • {event.category}
                                        </div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={() => {}}
            />
            <Button 
              onClick={() => handleSubmit()} 
              disabled={isSending || (!newMessage.trim() && !fileInputRef.current?.files?.length)}
              className="rounded-full min-w-[40px]"
            >
              {isSending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGroup;
