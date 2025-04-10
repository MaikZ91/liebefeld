
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
      
      // Eventdaten zur Nachricht hinzufügen, wenn vorhanden
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageContent = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${trimmedMessage}`;
      }
      
      // Optimistische Nachricht erstellen
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        created_at: new Date().toISOString(),
        content: messageContent,
        user_name: username,
        user_avatar: localStorage.getItem(AVATAR_KEY) || '',
        group_id: groupId,
      };
      
      // Optimistische Nachricht zum lokalen Zustand hinzufügen
      addOptimisticMessage(optimisticMessage);
      setNewMessage('');
      
      // Tipping-Status auf 'nicht tippend' setzen
      if (typing) {
        await chatService.sendTypingStatus(groupId, username, localStorage.getItem(AVATAR_KEY), false);
        setTyping(false);
      }
      
      // Medien-URL abrufen, wenn eine Datei ausgewählt wurde
      let mediaUrl = undefined;
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${groupId}/${fileName}`;
        
        const { error: uploadError, data } = await fetch(file); // Vereinfachte Datei-Upload-Logik - in der Realität würde hier der Upload erfolgen
        
        if (uploadError) {
          throw uploadError;
        }
        
        mediaUrl = URL.createObjectURL(file); // Vereinfacht - in der Realität würde hier die URL aus Supabase kommen
      }
      
      // Nachricht an den Server senden
      const messageId = await chatService.sendMessage(
        groupId,
        username,
        messageContent,
        localStorage.getItem(AVATAR_KEY),
        mediaUrl
      );
      
      if (!messageId) {
        throw new Error("Fehler beim Senden der Nachricht");
      }

      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Fehler beim Senden der Nachricht:', err);
      toast({
        title: "Fehler beim Senden",
        description: err.message || "Deine Nachricht konnte nicht gesendet werden",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [groupId, username, newMessage, isSending, typing, addOptimisticMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Tipping-Status aktualisieren
    const isCurrentlyTyping = e.target.value.trim().length > 0;
    
    if (!typing && isCurrentlyTyping) {
      // Tipping beginnt
      setTyping(true);
      chatService.sendTypingStatus(
        groupId,
        username,
        localStorage.getItem(AVATAR_KEY),
        true
      );
    }
    
    // Bestehenden Timeout löschen
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Neuen Timeout setzen
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

  // Aufräumen bei Unmount
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
