
import { useState, useRef, useCallback, useEffect } from 'react';
import { AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { realtimeService } from '@/services/realtimeService';

export const useMessageSending = (groupId: string, username: string, addOptimisticMessage: (message: any) => void) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async (event?: React.FormEvent, eventData?: any) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedMessage = newMessage.trim();
    if ((!trimmedMessage && !fileInputRef.current?.files?.length && !eventData) || isSending) {
      return;
    }

    setIsSending(true);

    try {
      console.log('Sending message to group:', groupId);
      
      let messageContent = trimmedMessage;
      
      // Add event data to message if available
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageContent = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${trimmedMessage}`;
      }
      
      // Create optimistic message for immediate display
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        created_at: new Date().toISOString(),
        content: messageContent,
        user_name: username,
        user_avatar: localStorage.getItem(AVATAR_KEY) || '',
        group_id: groupId,
      };
      
      // Add optimistic message to local state IMMEDIATELY
      addOptimisticMessage(optimisticMessage);
      
      // Clear the input field immediately
      setNewMessage('');
      
      // Set typing status to not typing
      if (typing) {
        const channel = supabase.channel(`typing:${groupId}`);
        channel.subscribe();
        
        // After subscribing, send the typing status
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
      
      // Process file upload if a file is selected
      let mediaUrl = null;
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        try {
          // Create a mock upload response for now
          mediaUrl = URL.createObjectURL(file);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
        }
      }
      
      // Send message to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: groupId,
          sender: username,
          text: messageContent,
          avatar: localStorage.getItem(AVATAR_KEY),
          media_url: mediaUrl,
          read_by: [username] // The sending person has already read the message
        }])
        .select('id')
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully with ID:', data?.id);
      
      // Broadcast to the specific channel for this group
      await realtimeService.sendToChannel(`messages:${groupId}`, 'new_message', {
        message: {
          ...optimisticMessage,
          id: data?.id || optimisticMessage.id
        }
      });

      // Reset file input
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
  }, [groupId, username, newMessage, isSending, typing, addOptimisticMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Update typing status
    const isCurrentlyTyping = e.target.value.trim().length > 0;
    
    if (!typing && isCurrentlyTyping) {
      // Typing begins
      setTyping(true);
      const channel = supabase.channel(`typing:${groupId}`);
      channel.subscribe();
      
      // After subscribing, send the typing status
      setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem(AVATAR_KEY),
            isTyping: true
          }
        });
      }, 100);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (typing) {
        const channel = supabase.channel(`typing:${groupId}`);
        channel.subscribe();
        
        // After subscribing, send the typing status
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
    }, 2000);
  }, [groupId, username, typing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (typing) {
      const channel = supabase.channel(`typing:${groupId}`);
      channel.subscribe();
      
      // After subscribing, send the typing status
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
      }, 100);
    }
  }, [groupId, username, typing]);

  return {
    newMessage,
    isSending,
    fileInputRef,
    handleSubmit,
    handleInputChange,
    handleKeyDown,
    setNewMessage,
    typing,
    cleanup
  };
};
