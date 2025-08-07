// src/components/chat/ChatGroup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotificationService';
import { USERNAME_KEY, AVATAR_KEY, TypingUser } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/chatUIUtils';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { useScrollManagement } from '@/hooks/chat/useScrollManagement';
import { eventChatService } from '@/services/eventChatService';
import { useNavigate } from 'react-router-dom';

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
  event_id?: string; // Added event_id for event messages
  event_title?: string; // Added event_title for event messages
  read_by?: string[];
  category?: string; // Added category field for message labeling
}

const ChatGroup: React.FC<ChatGroupProps> = ({
  groupId,
  groupName,
  onOpenUserDirectory
}) => {
  // Debug: Eindeutige Instanz-ID für diese ChatGroup-Instanz
  const instanceId = useRef(`ChatGroup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  console.log(`ChatGroup instance created: ${instanceId.current} for group: ${groupName}`);
  
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [selectedCategory, setSelectedCategory] = useState<string>('Ausgehen');
  const [messageFilter, setMessageFilter] = useState<string[]>(['alle']); // New filter state

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const channelsRef = useRef<any[]>([]);

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
          event_id: msg.event_id,
          event_title: msg.event_title,
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
            event_id: msg.event_id,
            event_title: msg.event_title,
            read_by: msg.read_by || []
          };

          // Add all messages from realtime - no duplicate check needed
          setMessages(prevMessages => [...prevMessages, newMessage]);

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
        event_id: msg.event_id,
        event_title: msg.event_title,
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

  // Handle sending messages using useMessageSending hook
  const handleSubmit = async () => {
    console.log('ChatGroup.handleSubmit called', { newMessage, username, groupId, selectedCategory });
    
    if (!newMessage.trim() || !username || !groupId) {
      console.log('ChatGroup.handleSubmit: early return due to missing data');
      return;
    }

    try {
      setIsSending(true);

      // Format message with category label
      let messageText = newMessage.trim();

      // Add category label to the message
      const categoryLabel = `#${selectedCategory.toLowerCase()}`;
      messageText = `${categoryLabel} ${messageText}`;

      console.log('ChatGroup.handleSubmit: sending message', { messageText, groupId });

      // Clear input immediately
      setNewMessage('');

      // Send message directly to database - no optimistic UI
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          sender: username,
          text: messageText,
          avatar: localStorage.getItem(AVATAR_KEY),
          read_by: [username]
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Trigger push notification (non-blocking)
      pushNotificationService.sendPush(username, messageText).catch((e) => {
        console.error('[ChatGroup] push send failed:', e);
      });

      console.log(`Message sent successfully from ${instanceId.current} (${groupName})`);
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

  // Handle joining event chat
  const handleJoinEventChat = async (eventId: string, eventTitle: string) => {
    try {
      const groupId = await eventChatService.joinEventChat(eventId, eventTitle);
      if (groupId) {
        // Navigate to the event chat page or show modal
        toast({
          title: "Event Chat beigetreten",
          description: `Du bist dem Event-Chat für "${eventTitle}" beigetreten.`,
        });
        // You could implement navigation to a specific event chat route here
        // For now, we'll just show the success message
      } else {
        throw new Error('Failed to join event chat');
      }
    } catch (error) {
      console.error('Error joining event chat:', error);
      toast({
        title: "Fehler",
        description: "Event-Chat konnte nicht beigetreten werden.",
        variant: "destructive"
      });
    }
  };

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
          event_id: msg.event_id,
          event_title: msg.event_title,
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
        onJoinEventChat={handleJoinEventChat}
      />

      <div className="p-3 bg-black border-t border-gray-800 flex-shrink-0">
        <MessageInput
          username={username}
          groupId={groupId}
          handleSendMessage={handleSubmit}
          isSending={isSending}
          value={newMessage}
          onChange={handleInputChangeFromMessageInput}
          onKeyDown={handleKeyDownFromMessageInput}
          placeholder="Schreibe eine Nachricht..."
          mode="community"
          onCategorySelect={setSelectedCategory}
          activeCategory={selectedCategory}
          groupType={groupType}
        />
      </div>
    </div>
  );
};

export default ChatGroup;