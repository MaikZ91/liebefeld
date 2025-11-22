// src/hooks/chat/useMessageSending.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { AVATAR_KEY, EventShare } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { realtimeService } from '@/services/realtimeService';
import { messageService } from '@/services/messageService';
import { ReplyData } from './useReplySystem';

export const useMessageSending = (groupId: string, username: string, addOptimisticMessage: (message: any) => void, selectedCategory: string = 'Ausgehen', replyTo?: ReplyData | null) => {
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
      let eventId = null;
      let eventTitle = null;
      
      // Add category label to the message
      const categoryLabel = `#${selectedCategory.toLowerCase()}`;
      
      // Variables for RSVP poll (only for events)
      let pollQuestion = null;
      let pollOptions = null;
      let pollVotes = {};
      
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        
        // First, create or find the event in community_events table
        const { data: existingEvent, error: findError } = await supabase
          .from('community_events')
          .select('id')
          .eq('title', title)
          .eq('date', date)
          .eq('time', time)
          .eq('location', location || '')
          .maybeSingle();

        if (findError) {
          console.error('Error finding event:', findError);
        }

        if (existingEvent) {
          // Use existing event
          eventId = existingEvent.id;
          eventTitle = title;
        } else {
          // Create new event
          const { data: newEvent, error: createError } = await supabase
            .from('community_events')
            .insert([{
              title,
              date,
              time,
              location: location || '',
              category: category || 'Sonstiges',
              description: '',
              source: 'community'
            }])
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating event:', createError);
          } else {
            eventId = newEvent.id;
            eventTitle = title;
          }
        }
        
        // Set up RSVP poll for the event
        pollQuestion = `${title} am ${date} um ${time} - Wer nimmt teil?`;
        pollOptions = ["Nehme teil", "Nein", "Vielleicht"];
        pollVotes = {}; // Empty votes object
        
        messageText = `📊 ${pollQuestion}`;
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
      
      console.log('Event data to be processed:', eventData);
      console.log('Event ID before creation:', eventId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: validGroupId,
          sender: username,
          text: messageText,
          avatar: localStorage.getItem(AVATAR_KEY),
          media_url: mediaUrl,
          event_id: eventId,
          event_title: eventTitle,
          event_date: eventData?.date || null,
          event_location: eventData?.location || null,
          event_image_url: null,
          poll_question: pollQuestion,
          poll_options: pollOptions,
          poll_votes: pollVotes,
          read_by: [username],
          reply_to_message_id: replyTo?.messageId || null,
          reply_to_sender: replyTo?.sender || null,
          reply_to_text: replyTo ? (replyTo.text.length > 100 ? replyTo.text.substring(0, 100) + '...' : replyTo.text) : null
        }])
        .select('id')
        .single();
        
      console.log('Message inserted with event_id:', eventId);
      console.log('Inserted message data:', data);
        
      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully with ID:', data?.id);

      // Send reply notification if this is a reply
      if (replyTo && data?.id) {
        await sendReplyNotification(replyTo, data.id, messageText);
      }

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
  }, [groupId, username, newMessage, isSending, typing, selectedCategory, replyTo]);

  // Add notification sending for replies
  const sendReplyNotification = useCallback(async (replyData: ReplyData, messageId: string, messageContent: string) => {
    try {
      // Send push notification to the original message sender
      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          sender: username,
          text: `@${replyData.sender} ${username} hat auf deine Nachricht geantwortet: "${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}"`,
          message_id: messageId,
          mention_user: replyData.sender
        }
      });
      
      if (error) {
        console.error('Failed to send reply notification:', error);
      }
    } catch (error) {
      console.error('Error sending reply notification:', error);
    }
  }, [username]);

  // Modified handleSubmit to handle reply notifications
  useEffect(() => {
    if (replyTo) {
      // Add @ mention to the message text
      const mentionText = `@${replyTo.sender} `;
      if (!newMessage.startsWith(mentionText)) {
        setNewMessage(mentionText);
      }
    }
  }, [replyTo, newMessage]);

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