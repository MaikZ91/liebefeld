import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { supabase } from '@/integrations/supabase/client';

export const useThreads = (groupId: string, username: string) => {
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});
  const [threadCounts, setThreadCounts] = useState<Record<string, number>>({});
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchThreadMessages = useCallback(async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('parent_id', parentId)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        created_at: msg.created_at,
        text: msg.text,
        user_name: msg.sender,
        user_avatar: msg.avatar || '',
        group_id: msg.group_id,
        reactions: Array.isArray(msg.reactions) ? msg.reactions as { emoji: string; users: string[] }[] : [],
        read_by: msg.read_by || []
      }));

      setThreadMessages(prev => ({
        ...prev,
        [parentId]: formattedMessages
      }));

      setThreadCounts(prev => ({
        ...prev,
        [parentId]: formattedMessages.length
      }));
    } catch (error) {
      console.error('Error fetching thread messages:', error);
    }
  }, [groupId]);

  const sendReply = useCallback(async (parentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          parent_id: parentId,
          sender: username,
          text: content,
          avatar: null
        });

      if (error) throw error;

      // Refresh thread messages
      await fetchThreadMessages(parentId);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  }, [groupId, username, fetchThreadMessages]);

  const toggleThread = useCallback((messageId: string) => {
    setExpandedThreads(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(messageId)) {
        newExpanded.delete(messageId);
      } else {
        newExpanded.add(messageId);
        // Fetch messages if not already loaded
        if (!threadMessages[messageId]) {
          fetchThreadMessages(messageId);
        }
      }
      return newExpanded;
    });
  }, [threadMessages, fetchThreadMessages]);

  const startReply = useCallback((messageId: string) => {
    setReplyingTo(messageId);
    if (!expandedThreads.has(messageId)) {
      toggleThread(messageId);
    }
  }, [expandedThreads, toggleThread]);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Initialize thread counts for messages
  const initializeThreadCounts = useCallback(async (messageIds: string[]) => {
    for (const messageId of messageIds) {
      if (!threadCounts[messageId]) {
        try {
          const { count, error } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('parent_id', messageId)
            .eq('group_id', groupId);

          if (error) throw error;

          setThreadCounts(prev => ({
            ...prev,
            [messageId]: count || 0
          }));
        } catch (error) {
          console.error('Error fetching thread count:', error);
        }
      }
    }
  }, [groupId, threadCounts]);

  // Set up real-time subscription for thread updates
  useEffect(() => {
    const channel = supabase
      .channel(`threads-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.parent_id) {
            // Update thread messages
            setThreadMessages(prev => ({
              ...prev,
              [newMessage.parent_id]: [
                ...(prev[newMessage.parent_id] || []),
                {
                  id: newMessage.id,
                  created_at: newMessage.created_at,
                  text: newMessage.text,
                  user_name: newMessage.sender,
                  user_avatar: newMessage.avatar || '',
                  group_id: newMessage.group_id,
                  reactions: Array.isArray(newMessage.reactions) ? newMessage.reactions as { emoji: string; users: string[] }[] : [],
                  read_by: newMessage.read_by || []
                }
              ]
            }));

            // Update thread count
            setThreadCounts(prev => ({
              ...prev,
              [newMessage.parent_id]: (prev[newMessage.parent_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return {
    threadMessages,
    threadCounts,
    expandedThreads,
    replyingTo,
    toggleThread,
    startReply,
    cancelReply,
    sendReply,
    initializeThreadCounts
  };
};