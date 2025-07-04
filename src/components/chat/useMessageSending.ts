
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';

export const useMessageSending = (groupId: string, username: string, addOptimisticMessage: (message: any) => void) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentMessageIds = useRef<Set<string>>(new Set());

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!newMessage.trim() || isSending) {
      return;
    }

    const trimmedMessage = newMessage.trim();
    setIsSending(true);

    try {
      console.log('Sending message to group:', groupId);
      
      const tempId = `temp-${Date.now()}`;
      
      // Track this temporary ID to prevent duplicate optimistic updates
      if (sentMessageIds.current.has(tempId)) {
        console.log('Duplicate message submission detected, ignoring');
        return;
      }
      sentMessageIds.current.add(tempId);
      
      const optimisticMessage = {
        id: tempId,
        created_at: new Date().toISOString(),
        content: trimmedMessage,
        user_name: username,
        user_avatar: localStorage.getItem(AVATAR_KEY) || '',
        group_id: groupId,
      };
      
      // Add optimistic message to local state before sending to server
      addOptimisticMessage(optimisticMessage);
      setNewMessage('');
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          text: trimmedMessage,
          sender: username,
          avatar: localStorage.getItem(AVATAR_KEY),
          group_id: groupId,
        }])
        .select();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Fehler beim Senden",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Message sent successfully:', data);
        
        // Force a re-sync of messages from the server after sending
        const channel = supabase.channel(`force_refresh:${groupId}`);
        channel.subscribe();
        channel.send({
          type: 'broadcast',
          event: 'force_refresh',
          payload: { timestamp: new Date().toISOString() }
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({
        title: "Fehler beim Senden",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
    
    if (!typing && e.target.value.trim()) {
      setTyping(true);
      supabase
        .channel(`typing:${groupId}`)
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
      if (typing) {
        supabase
          .channel(`typing:${groupId}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              username,
              avatar: localStorage.getItem(AVATAR_KEY),
              isTyping: false
            }
          });
        setTyping(false);
      }
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return {
    newMessage,
    isSending,
    fileInputRef,
    handleSubmit,
    handleInputChange,
    handleKeyDown,
    setNewMessage,
    typing,
    typingTimeoutRef
  };
};
