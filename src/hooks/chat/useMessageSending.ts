
// src/hooks/chat/useMessageSending.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { AVATAR_KEY, EventShare } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { realtimeService } from '@/services/realtimeService';
import { messageService } from '@/services/messageService';

export const useMessageSending = (groupId: string, username: string, addOptimisticMessage: (message: any) => void) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async (event?: React.FormEvent, eventData?: EventShare) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedMessage = newMessage.trim();
    if ((!trimmedMessage && !fileInputRef.current?.files?.length && !eventData) || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;
      console.log('Sending message to group:', validGroupId);
      
      let messageContent = trimmedMessage;
      
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageContent = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${trimmedMessage}`;
      }
      
      // Set the input field back immediately
      setNewMessage('');
      
      // Reset typing status
      if (typing) {
        const channel = supabase.channel(`typing:${validGroupId}`);
        channel.subscribe();
        
        setTimeout(() => {
          channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              username,
              avatar: localStorage.getItem(AVATAR_KEY),
              isTyping: false
            }
          });
          setTyping(false);
        }, 100);
      }
      
      let mediaUrl = null;
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        // Here would be the actual file upload logic
        mediaUrl = URL.createObjectURL(file); // Just a mock URL for now
      }
      
      // Send the message to the database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: validGroupId,
          sender: username,
          text: messageContent,
          avatar: localStorage.getItem(AVATAR_KEY),
          media_url: mediaUrl,
          read_by: [username]
        }])
        .select('id')
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully with ID:', data?.id);
      
      // Send a broadcast for the new message to update all clients
      await realtimeService.sendToChannel(`messages:${validGroupId}`, 'new_message', {
        message: {
          id: data?.id,
          created_at: new Date().toISOString(),
          content: messageContent,
          user_name: username,
          user_avatar: localStorage.getItem(AVATAR_KEY) || '',
          group_id: validGroupId
        }
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({
        title: "Error sending",
        description: err.message || "Your message couldn't be sent",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [groupId, username, newMessage, isSending, typing]);

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
