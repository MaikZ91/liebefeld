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
      
      // Entfernen Sie die Zeilen für optimistische Updates:
      // const tempId = `temp-${Date.now()}`;
      // const optimisticMessage = { /* ... */ };
      // addOptimisticMessage(optimisticMessage); // DIESE ZEILE ENTFERNEN

      // Setzen Sie das Eingabefeld sofort zurück
      setNewMessage('');
      
      // Setzen Sie den Tippstatus zurück
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
        // Hier wäre die tatsächliche Dateiupload-Logik
        mediaUrl = URL.createObjectURL(file); // Nur ein Mock-URL für jetzt
      }
      
      // Senden Sie die Nachricht an die Datenbank
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
      
      // Senden Sie einen Broadcast für die neue Nachricht, um alle Clients zu aktualisieren
      // Ihr Echtzeit-Abonnement in useChatMessages sollte diese Nachricht aufnehmen und zum State hinzufügen
      await realtimeService.sendToChannel(`messages:${validGroupId}`, 'new_message', {
        message: { // Senden Sie hier die tatsächliche Nachricht vom Server, falls sie sofort benötigt wird,
                   // aber die Hauptlogik des Hinzufügens sollte über das `postgres_changes` Abo erfolgen.
          id: data?.id, // Wichtig: Die echte ID hier übergeben
          created_at: new Date().toISOString(), // Aktuellen Zeitstempel für die Anzeige
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
  // ^^^ HIER WAR DER FEHLERHAFTE KOMMENTAR

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Update typing status
    const isCurrentlyTyping = e.target.value.trim().length > 0;
    
    // Ensure we have a valid UUID for groupId
    const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;
    
    if (!typing && isCurrentlyTyping) {
      // Typing begins
      setTyping(true);
      const channel = supabase.channel(`typing:${validGroupId}`);
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
        const channel = supabase.channel(`typing:${validGroupId}`);
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
        }, 2000);
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