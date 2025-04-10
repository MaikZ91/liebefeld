
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TypingUser } from '@/types/chatTypes';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
}

export const useChatMessages = (groupId: string, username: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const initializeScrollPosition = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        console.log(`Fetching messages for group: ${groupId}`);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          setError(error.message);
        } else {
          console.log(`Received ${data?.length || 0} messages for group ${groupId}`);
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
        console.error('Error in fetchMessages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setTimeout(() => {
          initializeScrollPosition();
        }, 100);
      }
    };

    if (groupId) {
      console.log(`Group ID changed, fetching messages for: ${groupId}`);
      fetchMessages();
    }
  }, [groupId]);

  useEffect(() => {
    if (messages.length > 0) {
      console.log('Messages changed, scrolling to bottom');
      setTimeout(() => {
        initializeScrollPosition();
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!groupId) {
      console.log('No group ID, skipping subscription');
      return;
    }
    
    let ignore = false;
    console.log(`Setting up subscription for group: ${groupId}`);

    const channel = supabase
      .channel(`group_chat:${groupId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
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
            
            console.log('New message received via subscription:', newMsg);
            setMessages((oldMessages) => {
              if (oldMessages.some(msg => msg.id === newMsg.id)) {
                return oldMessages;
              }
              return [...oldMessages, newMsg];
            });
            setLastSeen(new Date());
            
            setTimeout(() => {
              initializeScrollPosition();
            }, 100);
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
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          await channel.track({ username });
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
      console.log(`Unsubscribing from group: ${groupId}`);
      ignore = true;
      channel.unsubscribe();
    };
  }, [groupId, username]);

  const handleReconnect = () => {
    setIsReconnecting(true);
    supabase.removeAllChannels().then(() => {
      setTimeout(() => {
        setIsReconnecting(false);
      }, 3000);
    });
  };

  return {
    messages,
    loading,
    error,
    typing,
    typingUsers,
    isReconnecting,
    setMessages,
    setError,
    handleReconnect,
    chatBottomRef,
    chatContainerRef,
    initializeScrollPosition
  };
};
