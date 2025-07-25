// src/components/chat/ChatGroup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY, AVATAR_KEY, TypingUser } from '@/types/chatTypes';
import { useEventContext } from '@/contexts/EventContext';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/chatUIUtils';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';

interface ChatGroupProps {
  groupId: string;
  groupName: string;
  onOpenUserDirectory?: () => void;
}

interface Message {
  id: string;
  created_at: string;
  text: string; // Changed from 'content' to 'text'
  user_name: string;
  user_avatar: string;
  group_id: string;
  read_by?: string[];
  category?: string; // Added category field for message labeling
}

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
  // const [isTyping, setIsTyping] = useState(false); // Diese Zeile wurde entfernt
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Ausgehen');
  const [messageFilter, setMessageFilter] = useState<string[]>(['alle']); // New filter state

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const channelsRef = useRef<any[]>([]);
  const sentMessageIds = useRef<Set<string>>(new Set());

  const { events } = useEventContext();

  // Use scroll management hook
  const scrollManagement = useScrollManagement(messages, typingUsers);

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
          text: msg.text, // Use 'text' directly from database
          user_name: msg.sender,
          user_avatar: msg.avatar || '',
          group_id: msg.group_id,
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
            text: msg.text, // Use 'text' directly from database
            user_name: msg.sender,
            user_avatar: msg.avatar || '',
            group_id: msg.group_id,
            read_by: msg.read_by || []
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
        text: msg.text, // Use 'text' directly from database
        user_name: msg.sender,
        user_avatar: msg.avatar || '',
        group_id: msg.group_id,
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
  const handleSubmit = async (eventData?: any) => {
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length && !eventData) || !username || !groupId) {
      return;
    }

    try {
      setIsSending(true);

      // Format message with category label and event data if present
      let messageText = newMessage.trim();

      // Add category label to the message
      const categoryLabel = `#${selectedCategory.toLowerCase()}`;

      if (eventData) {
        const { title, date, time, location, category } = eventData;
        // Use \\n for line breaks in the string to be parsed correctly by `EventMessageFormatter`
        messageText = `${categoryLabel} 🗓️ **Event: ${title}**\\nDatum: ${date} um ${time}\\nOrt: ${location || 'k.A.'}\\nKategorie: ${category}\\n\\n${messageText}`;
      } else {
        // Add category label to regular messages
        messageText = `${categoryLabel} ${messageText}`;
      }

      // Create optimistic message
      const tempId = `temp-${Date.now()}`;

      // Check if this message was already sent (prevent duplicates)
      if (sentMessageIds.current.has(tempId)) {
        console.log('Duplicate submission detected, ignoring');
        return;
      }

      // Track this message ID
      sentMessageIds.current.add(tempId);

      const optimisticMessage: Message = {
        id: tempId,
        created_at: new Date().toISOString(),
        text: messageText, // Use 'text' instead of 'content'
        user_name: username,
        user_avatar: localStorage.getItem(AVATAR_KEY) || '',
        group_id: groupId,
        read_by: [username]
      };

      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Clear input
      setNewMessage('');

      // Send message to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          sender: username,
          text: messageText,
          avatar: localStorage.getItem(AVATAR_KEY),
          read_by: [username]
        })
        .select('id');

      if (error) {
        console.error('Error sending message:', error);
        throw error;
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

  // Handle input change from MessageInput
  const handleInputChangeFromMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  // Handle key down from MessageInput
  const handleKeyDownFromMessageInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handleSelectEventToShare = (event: any) => {
    const eventData = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category
    };

    setIsEventSelectOpen(false);
    handleSubmit(eventData);
  };

  // Listen for category changes from MessageInput and sync filter
  useEffect(() => {
    const handleCategoryChange = (event: any) => {
      const category = event.detail.category;
      // Auto-sync filter when user changes category for sending
      if (category && messageFilter.includes('alle')) {
        setMessageFilter([category.toLowerCase()]);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('categoryChanged', handleCategoryChange);
      return () => window.removeEventListener('categoryChanged', handleCategoryChange);
    }
  }, [messageFilter]);

  // Filter messages based on selected categories
  const filteredMessages = React.useMemo(() => {
    if (messageFilter.includes('alle')) {
      return messages;
    }

    return messages.filter(message => {
      // Check if message contains any of the selected hashtags
      const messageText = message.text.toLowerCase();
      return messageFilter.some(category =>
        messageText.includes(`#${category.toLowerCase()}`)
      );
    });
  }, [messages, messageFilter]);

  return (
    <div className="flex flex-col h-full max-h-full bg-black overflow-hidden">
      <div className="border-b border-gray-800 bg-black py-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mr-3">
              <span className="text-white font-bold">{groupName.slice(0, 1).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{groupName}</h3>
              <p className="text-sm text-gray-400">{filteredMessages.length} Nachrichten</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Benutzerverzeichnis-Button */}
            {onOpenUserDirectory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full p-0 px-2 text-red-300 hover:text-red-200 hover:bg-red-900/20"
                onClick={onOpenUserDirectory}
              >
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">Benutzer</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter UI */}
        <div className="px-0 py-2 border-b border-gray-800">
          <div className="flex flex-wrap gap-2">
            {['alle', 'ausgehen', 'kreativität', 'sport'].map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs rounded-full ${
                  messageFilter.includes(category)
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                onClick={() => {
                  if (category === 'alle') {
                    setMessageFilter(['alle']);
                  } else {
                    setMessageFilter(prev => {
                      const newFilter = prev.filter(f => f !== 'alle');
                      if (newFilter.includes(category)) {
                        const result = newFilter.filter(f => f !== category);
                        return result.length === 0 ? ['alle'] : result;
                      } else {
                        return [...newFilter, category];
                      }
                    });
                  }
                }}
              >
                #{category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <MessageList
        messages={filteredMessages.map(msg => ({
          id: msg.id,
          created_at: msg.created_at,
          text: msg.text, // Use 'text' instead of 'content'
          user_name: msg.user_name,
          user_avatar: msg.user_avatar,
          group_id: msg.group_id,
          reactions: []
        }))}
        loading={loading}
        error={error}
        username={username}
        typingUsers={typingUsers}
        formatTime={formatTime}
        isGroup={isGroup}
        groupType={groupType}
        chatBottomRef={scrollManagement.chatBottomRef}
      />

      <div className="p-3 bg-black border-t border-gray-800 flex-shrink-0">
        <MessageInput
          username={username}
          groupId={groupId}
          handleSendMessage={handleSubmit}
          isEventSelectOpen={isEventSelectOpen}
          setIsEventSelectOpen={setIsEventSelectOpen}
          eventSelectContent={
            <>
              <div className="p-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Input
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    placeholder="Event suchen..."
                    className="bg-black border-gray-800"
                  />
                </div>
              </div>
              <ScrollArea className="h-[350px]">
                <div className="p-2 space-y-2">
                  {filteredEvents.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Keine Events gefunden</p>
                  ) : (
                    filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 bg-black rounded-md hover:bg-gray-900 cursor-pointer border border-gray-800"
                        onClick={() => handleSelectEventToShare(event)}
                      >
                        <p className="font-medium text-white">{event.title}</p>
                        <p className="text-sm text-gray-400">
                          {event.date} um {event.time} • {event.category}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          }
          isSending={isSending}
          value={newMessage}
          onChange={handleInputChangeFromMessageInput}
          onKeyDown={handleKeyDownFromMessageInput}
          placeholder="Schreibe eine Nachricht..."
          mode="community"
          onCategorySelect={setSelectedCategory}
          activeCategory={selectedCategory}
        />
      </div>
    </div>
  );
};

export default ChatGroup;