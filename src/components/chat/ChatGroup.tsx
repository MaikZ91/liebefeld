
import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Paperclip, Calendar, Users, Smile } from 'lucide-react';
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
import { getInitials, formatRelativeTime } from '@/utils/chatUIUtils';
import { reactionService } from '@/services/reactionService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';

interface ChatGroupProps {
  groupId: string;
  groupName: string;
  onOpenUserDirectory?: () => void;
}

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
  reactions?: { emoji: string; users: string[] }[];
  read_by?: string[];
}

// Emoji reactions that users can select
const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉'];

const ChatGroup: React.FC<ChatGroupProps> = ({ 
  groupId, 
  groupName, 
  onOpenUserDirectory 
}) => {
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
  const sentMessageIds = useRef<Set<string>>(new Set());
  
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
          reactions: msg.reactions || [],
          read_by: msg.read_by || []
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
            group_id: msg.group_id,
            reactions: msg.reactions || [],
            read_by: msg.read_by || []
          };
          
          // Prevent duplicate messages by checking if message already exists
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(m => m.id === newMessage.id);
            if (messageExists) {
              console.log('Message already exists, skipping duplicate:', newMessage.id);
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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        console.log('Message updated (likely reactions):', payload);
        
        if (payload.new) {
          const updatedMsg = payload.new as any;
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === updatedMsg.id 
                ? { ...msg, reactions: updatedMsg.reactions || [] }
                : msg
            )
          );
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
        reactions: msg.reactions || [],
        read_by: msg.read_by || []
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
      return `vor ${diffInMinutes} Min`;
    } else if (diffInHours < 24) {
      return `vor ${diffInHours} Std`;
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
    
    // Prevent duplicate submissions
    const messageId = `${Date.now()}-${username}`;
    if (sentMessageIds.current.has(messageId)) {
      console.log('Duplicate submission detected, ignoring');
      return;
    }
    sentMessageIds.current.add(messageId);
    
    // Clear the message ID after a timeout to allow future messages
    setTimeout(() => {
      sentMessageIds.current.delete(messageId);
    }, 1000);
    
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
      
      // Clear input immediately
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
        typingUpdateChannel.subscribe();
        
        // Send the typing update
        typingUpdateChannel.send({
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
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Die Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle typing
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      
      // Create a new channel for typing updates
      const typingUpdateChannel = supabase.channel(`typing:${groupId}`);
      
      // Subscribe and send typing update
      typingUpdateChannel.subscribe();
      
      // After subscription, send the message
      typingUpdateChannel.send({
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
        typingUpdateChannel.subscribe();
        
        // After subscription, send the message
        typingUpdateChannel.send({
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
    }, 2000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Filter events for sharing based on search query
  const filteredEvents = events.filter(event => {
    if (!eventSearchQuery) return true;
    
    const query = eventSearchQuery.toLowerCase();
    return (
      event.title?.toLowerCase().includes(query) || 
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.category?.toLowerCase().includes(query)
    );
  });
  
  const handleShareEvent = (event: any) => {
    const eventData = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category
    };
    
    setIsEventSelectOpen(false);
    handleSubmit(undefined, eventData);
  };

  // Handle emoji reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await reactionService.toggleReaction(messageId, emoji, username);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Fehler",
        description: "Reaktion konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="border-b border-gray-800 bg-black py-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">{groupName.slice(0, 1).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{groupName}</h3>
              <p className="text-xs text-gray-400">{messages.length} Nachrichten</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Benutzerverzeichnis-Button */}
            {onOpenUserDirectory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full p-0 px-2 text-red-300 hover:text-red-200 hover:bg-red-900/20"
                onClick={onOpenUserDirectory}
              >
                <Users className="h-3 w-3 mr-1" />
                <span className="text-xs">Benutzer</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0"
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              <RefreshCw className={`h-3 w-3 ${isReconnecting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 bg-black">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-red-500 rounded-full"></div>
            </div>
          )}
          
          {error && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={handleReconnect}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reconnect
                </Button>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="flex flex-col space-y-1">
              {messages.map((message, index) => {
                const isConsecutive = index > 0 && messages[index - 1].user_name === message.user_name;
                const timeAgo = formatTime(message.created_at);
                
                return (
                  <div key={message.id} className="w-full group hover:bg-gray-900/30 rounded-lg p-1 transition-colors">
                    {!isConsecutive && (
                      <div className="flex items-center mb-1">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={message.user_avatar} alt={message.user_name} />
                          <AvatarFallback className="bg-red-500 text-xs">{getInitials(message.user_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-white text-sm">{message.user_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{timeAgo}</span>
                      </div>
                    )}
                    <div className={`ml-8 ${isConsecutive ? 'mt-0' : 'mt-1'}`}>
                      <div className="bg-gray-900/50 rounded-lg p-2 text-white text-sm break-words relative">
                        {message.content}
                        
                        {/* Emoji reactions display */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleReaction(message.id, reaction.emoji)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                                  reaction.users.includes(username)
                                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                                }`}
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Emoji reaction selector - appears on hover */}
                        <div className="absolute top-0 right-0 transform translate-x-full -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 bg-gray-800 hover:bg-gray-700">
                                <Smile className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 bg-gray-800 border-gray-700">
                              <div className="flex gap-1">
                                {EMOJI_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(message.id, emoji)}
                                    className="p-2 rounded hover:bg-gray-700 transition-colors text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.length > 0 && (
                <div className="ml-8">
                  <div className="text-gray-400 text-xs flex items-center">
                    {typingUsers.length === 1 ? (
                      <>{typingUsers[0].username} schreibt...</>
                    ) : (
                      <>{typingUsers.length} Personen schreiben...</>
                    )}
                    <div className="flex ml-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatBottomRef}></div>
            </div>
          )}
        </div>
        
        <div className="p-2 bg-black border-t border-gray-800">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 bg-gray-900 rounded-lg relative border border-gray-800">
              <Textarea
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                placeholder="Schreibe eine Nachricht..."
                className="min-h-[36px] max-h-20 resize-none bg-gray-900 border-0 focus:ring-red-500 focus:border-red-500 placeholder-gray-500 text-white pr-20 text-sm"
              />
              <div className="absolute right-1 bottom-1 flex items-center gap-1">
                <Popover open={isEventSelectOpen} onOpenChange={setIsEventSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 max-h-[400px]" side="top">
                    <div className="p-2 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          placeholder="Event suchen..."
                          className="bg-black border-gray-800 text-sm"
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <div className="p-2 space-y-2">
                        {filteredEvents.length === 0 ? (
                          <p className="text-gray-400 text-center py-4 text-sm">Keine Events gefunden</p>
                        ) : (
                          filteredEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className="p-2 bg-black rounded-md hover:bg-gray-900 cursor-pointer border border-gray-800"
                              onClick={() => handleShareEvent(event)}
                            >
                              <p className="font-medium text-white text-sm">{event.title}</p>
                              <p className="text-xs text-gray-400">
                                {event.date} um {event.time} • {event.category}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isSending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg h-9 px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatGroup;
