
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChatMessage from './ChatMessage';
import EventMessageFormatter from './EventMessageFormatter';
import { getInitials } from '@/utils/chatUIUtils';
import { USERNAME_KEY, AVATAR_KEY, TypingUser } from '@/types/chatTypes';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
}

interface ChatGroupProps {
  groupId: string;
  groupName: string;
  compact?: boolean;
}

const ChatGroup: React.FC<ChatGroupProps> = ({ groupId, groupName, compact = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [error, setError] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
    }
  }, [username]);

  useEffect(() => {
    if (avatar) {
      localStorage.setItem(AVATAR_KEY, avatar);
    }
  }, [avatar]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (error) {
          setError(error.message);
        } else {
          const formattedMessages: Message[] = (data || []).map(msg => ({
            id: msg.id,
            created_at: msg.created_at,
            content: msg.text,
            user_name: msg.sender,
            user_avatar: msg.avatar || '',
            group_id: msg.group_id,
          }));
          
          setMessages(formattedMessages);
          setLastSeen(new Date());
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [groupId]);

  useEffect(() => {
    let ignore = false;

    const channel = supabase
      .channel(`group_chat:${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (payload.new && payload.eventType === 'INSERT') {
          const newPayload = payload.new as any;
          if (newPayload && newPayload.group_id === groupId) {            
            const newMsg: Message = {
              id: newPayload.id,
              created_at: newPayload.created_at,
              content: newPayload.text,
              user_name: newPayload.sender,
              user_avatar: newPayload.avatar || '',
              group_id: newPayload.group_id,
            };
            
            setMessages((oldMessages) => [...oldMessages, newMsg]);
            setLastSeen(new Date());
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (!ignore) {
          const state = channel.presenceState();
          const presenceState = state as Record<string, any>;
          const onlineUsers = Object.keys(presenceState[groupId] || {});
          const typingUsers = onlineUsers.map(username => ({ username, lastTyped: new Date() }));
          setTypingUsers(typingUsers);
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (!ignore) {
          setTypingUsers(prevTypingUsers => {
            if (!prevTypingUsers.find(user => user.username === key)) {
              return [...prevTypingUsers, { username: key, lastTyped: new Date() }];
            }
            return prevTypingUsers;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (!ignore) {
          setTypingUsers(prevTypingUsers => prevTypingUsers.filter(user => user.username !== key));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username: localStorage.getItem(USERNAME_KEY) });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          if (!ignore) {
            setIsReconnecting(true);
            setTimeout(() => {
              channel.unsubscribe();
              channel.subscribe();
              setIsReconnecting(false);
            }, 5000);
          }
        }
      });

    return () => {
      ignore = true;
      channel.unsubscribe();
    };
  }, [groupId, username]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    const trimmedMessage = newMessage.trim();
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          text: trimmedMessage,
          sender: username,
          avatar: avatar,
          group_id: groupId,
        }])
        .select();

      if (error) {
        console.error('Error sending message:', error);
        setError(error.message);
      } else if (data && data.length > 0) {
        const newMsg: Message = {
          id: data[0].id,
          created_at: data[0].created_at,
          content: data[0].text,
          user_name: data[0].sender,
          user_avatar: data[0].avatar || '',
          group_id: data[0].group_id,
        };
        
        setMessages(prevMessages => [...prevMessages, newMsg]);
        setLastSeen(new Date());
        setError(null);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleReconnect = () => {
    setIsReconnecting(true);
    supabase.removeAllChannels().then(() => {
      setTimeout(() => {
        setIsReconnecting(false);
      }, 3000);
    });
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  // Helper function to format event messages
  const formatEventMessage = (content: string) => {
    // Check if content includes event information
    if (content.includes('🗓️ **Event:')) {
      try {
        // Extract event title
        const titleMatch = content.match(/🗓️ \*\*Event: (.*?)\*\*/);
        const eventTitle = titleMatch ? titleMatch[1] : '';
        
        // Extract date and time
        const dateTimeMatch = content.match(/Datum: (.*?) um (.*?)(?:\n|$)/);
        const eventDate = dateTimeMatch ? dateTimeMatch[1] : '';
        const eventTime = dateTimeMatch ? dateTimeMatch[2] : '';
        
        // Extract location
        const locationMatch = content.match(/Ort: (.*?)(?:\n|$)/);
        const eventLocation = locationMatch ? locationMatch[1] : '';
        
        // Extract category
        const categoryMatch = content.match(/Kategorie: (.*?)(?:\n|$)/);
        const eventCategory = categoryMatch ? categoryMatch[1] : '';
        
        // Extract user message part (after the event data)
        const userMessageMatch = content.match(/(?:\n\n)([\s\S]*)/);
        const userMessage = userMessageMatch ? userMessageMatch[1] : '';
        
        return (
          <div className="event-message">
            <div className="bg-gray-800 rounded-lg p-3 mb-2 border border-red-500/30">
              <div className="text-sm font-semibold text-white mb-1">Geteiltes Event</div>
              <div className="text-lg font-bold text-white">{eventTitle}</div>
              <div className="text-xs text-gray-300 mt-1">
                <span>{eventDate}</span>
                {eventTime && <span> • {eventTime}</span>}
                {eventLocation && <span> • {eventLocation}</span>}
              </div>
              <div className="text-xs bg-red-500 text-white inline-block px-2 py-0.5 rounded mt-2">
                {eventCategory || "Event"}
              </div>
            </div>
            {userMessage && <div className="text-sm text-white mt-2">{userMessage}</div>}
          </div>
        );
      } catch (error) {
        console.error("Error formatting event message:", error);
        return <div className="text-sm text-white">{content}</div>;
      }
    }
    
    return <div className="text-sm text-white">{content}</div>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-gray-900 text-white flex items-center justify-between">
        {!compact && <h3 className="text-lg font-semibold">{groupName}</h3>}
        <div className="flex items-center space-x-2">
          {isReconnecting && (
            <Button variant="secondary" disabled>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Reconnecting...
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleReconnect}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {!compact && <Users className="h-5 w-5" />}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-gray-700">
        {loading && <div className="text-center text-gray-500">Loading messages...</div>}
        {error && <div className="text-center text-red-500">Error: {error}</div>}

        {messages.map((message, index) => {
          const isConsecutive = index > 0 && messages[index - 1].user_name === message.user_name;
          const timeAgo = formatTime(message.created_at);

          return (
            <div key={message.id} className="mb-2">
              {!isConsecutive && (
                <div className="flex items-start mb-1">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={message.user_avatar} alt={message.user_name} />
                    <AvatarFallback>{getInitials(message.user_name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-semibold text-gray-300">{message.user_name}</div>
                  <span className="text-xs text-gray-500 ml-1">{timeAgo}</span>
                </div>
              )}
              <div className="ml-8">
                {formatEventMessage(message.content)}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      <div className="bg-gray-900 p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Nachricht senden..."
            className="w-full rounded-md py-2 px-3 bg-gray-800 text-white border-gray-700 pr-10"
            rows={1}
            style={{ resize: 'none' }}
          />
          <Button
            type="submit"
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white rounded-md p-2"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatGroup;
