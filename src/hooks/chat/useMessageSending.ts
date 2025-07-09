// src/hooks/chat/useMessageSending.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { AVATAR_KEY, EventShare } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { messageService } from '@/services/messageService';

export const useMessageSending = (groupId: string, username: string, addOptimisticMessage: (message: any) => void, selectedCategory: string = 'Ausgehen') => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified handleSubmit signature to match ChatInputProps['handleSendMessage'] and FullPageChatBot's external handler
  const handleSubmit = useCallback(async (content?: string | EventShare) => { // Accept string or EventShare
    // Determine if content is a string message or an eventData object
    const isEventShare = typeof content === 'object' && content !== null && 'title' in content;
    const messageToSend = isEventShare ? newMessage.trim() : (content as string || newMessage.trim());
    const eventData = isEventShare ? (content as EventShare) : undefined;

    if ((!messageToSend && !fileInputRef.current?.files?.length && !eventData) || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;
      console.log('Sending message to group:', validGroupId);
      
      let messageText = messageToSend;
      
      // Add category label to the message
      const categoryLabel = `#${selectedCategory.toLowerCase()}`;
      
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageText = `${categoryLabel} 🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${messageToSend}`;
      } else {
        // Add category label to regular messages
        messageText = `${categoryLabel} ${messageToSend}`;
      }
      
      setNewMessage(''); // Clear message after determining content
      
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
        mediaUrl = URL.createObjectURL(file);
      }
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: validGroupId,
          sender: username,
          text: messageText,
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
  }, [groupId, username, newMessage, isSending, typing, selectedCategory]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  }, [groupId, username, typing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(); // Call with no arguments, it will use newMessage
    }
  }, [handleSubmit]);

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