
import { useState, useRef, useCallback } from 'react';
import { AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { chatService } from '@/services/chatService';

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
      console.log('Nachricht senden an Gruppe:', groupId);
      
      let messageContent = trimmedMessage;
      
      // Add event data to message if available
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageContent = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${trimmedMessage}`;
      }
      
      // Create optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        created_at: new Date().toISOString(),
        content: messageContent,
        user_name: username,
        user_avatar: localStorage.getItem(AVATAR_KEY) || '',
        group_id: groupId,
      };
      
      // Add optimistic message to local state
      addOptimisticMessage(optimisticMessage);
      setNewMessage('');
      
      // Set typing status to not typing
      if (typing) {
        await chatService.sendTypingStatus(groupId, username, localStorage.getItem(AVATAR_KEY), false);
        setTyping(false);
      }
      
      // Process file upload if a file is selected
      let mediaUrl = undefined;
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${groupId}/${fileName}`;
        
        // Simplified file upload logic - in reality, this would use supabase storage
        // This is a placeholder for the actual upload
        try {
          // Create a mock upload response
          mediaUrl = URL.createObjectURL(file);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error('File upload failed');
        }
      }
      
      // Send message to server
      const messageId = await chatService.sendMessage(
        groupId,
        username,
        messageContent,
        localStorage.getItem(AVATAR_KEY),
        mediaUrl
      );
      
      if (!messageId) {
        throw new Error("Error sending message");
      }

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
      chatService.sendTypingStatus(
        groupId,
        username,
        localStorage.getItem(AVATAR_KEY),
        true
      );
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (typing) {
        chatService.sendTypingStatus(
          groupId,
          username,
          localStorage.getItem(AVATAR_KEY),
          false
        );
        setTyping(false);
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
      chatService.sendTypingStatus(groupId, username, localStorage.getItem(AVATAR_KEY), false);
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
