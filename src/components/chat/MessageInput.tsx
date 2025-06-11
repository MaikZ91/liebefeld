// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Paperclip, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { EventShare } from '@/types/chatTypes';
import { messageService } from '@/services/messageService';

interface MessageInputProps {
  username: string;
  groupId: string;
  handleSendMessage: (eventData?: any) => Promise<void>;
  isEventSelectOpen: boolean;
  setIsEventSelectOpen: (open: boolean) => void;
  eventSelectContent: React.ReactNode;
  isSending: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  mode?: 'ai' | 'community'; // Added mode prop
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  username, 
  groupId, 
  handleSendMessage, 
  isEventSelectOpen, 
  setIsEventSelectOpen,
  eventSelectContent,
  isSending,
  value,
  onChange,
  onKeyDown,
  placeholder = "Schreibe eine Nachricht...",
  mode = 'community' // Default to community mode
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ensure we have a valid UUID for groupId
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
      return;
    }
    
    setNewMessage(e.target.value);
    
    // Only broadcast typing status if we have a username and groupId
    if (username && groupId) {
      if (!isTyping && e.target.value.trim()) {
        setIsTyping(true);
        try {
          const channel = supabase.channel(`typing:${validGroupId}`);
          channel.subscribe();
          
          // After subscribing, send the typing status
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'typing',
              payload: {
                username,
                avatar: localStorage.getItem('community_chat_avatar'),
                isTyping: true
              }
            });
          }, 100);
        } catch (error) {
          console.error('Error sending typing status:', error);
        }
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          try {
            const channel = supabase.channel(`typing:${validGroupId}`);
            channel.subscribe();
            
            // After subscribing, send the typing status
            setTimeout(() => {
              channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: {
                  username,
                  avatar: localStorage.getItem('community_chat_avatar'),
                  isTyping: false
                }
              });
            }, 100);
          } catch (error) {
            console.error('Error sending typing status:', error);
          }
          setIsTyping(false);
        }
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const messageToSend = value !== undefined ? value : newMessage;
    if ((messageToSend.trim() || fileInputRef.current?.files?.length) && !isSending) {
      try {
        await handleSendMessage();
        if (value === undefined) {
          setNewMessage("");
        }
      } catch (error) {
        console.error('Error in message submission:', error);
      }
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleShareEvent = () => {
    setIsEventSelectOpen(true);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Determine padding based on mode and number of active left-side buttons
  const leftPadding = mode === 'community' ? 'pl-[75px]' : 'pl-4'; // Adjusted for 2 buttons on left

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 relative">
        <Textarea 
          placeholder={placeholder}
          value={value !== undefined ? value : newMessage}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          className={`min-h-[50px] flex-grow resize-none pr-14 border-2 border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500 shadow-md shadow-red-500/10 transition-all duration-200 placeholder-red-500 ${leftPadding}`}
        />
        {/* Buttons on the left side of the input (absolute positioning) */}
        <div className="flex flex-col gap-2 absolute left-1 top-1">
          {mode === 'community' && ( // Only show in community mode
            <Popover open={isEventSelectOpen} onOpenChange={setIsEventSelectOpen}>
              <PopoverTrigger asChild>
                <Button 
                  onClick={handleShareEvent} 
                  variant="outline"
                  size="icon"
                  type="button"
                  className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10"
                  title="Event teilen"
                >
                  <Calendar className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0 max-h-[400px] overflow-y-auto" 
                side="top" 
                align="start" // Changed align to start to keep it left-aligned
                sideOffset={5}
              >
                {eventSelectContent}
              </PopoverContent>
            </Popover>
          )}
          <Button 
            onClick={handleFileUpload} 
            variant="outline"
            size="icon"
            type="button"
            className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10"
            title="Bild anhängen"
          >
            <Paperclip className="h-3 w-3" />
          </Button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={() => {}}
        />
        {/* Send button on the right */}
        <Button 
          onClick={handleSubmit} 
          disabled={isSending || (!value?.trim() && !newMessage.trim() && !fileInputRef.current?.files?.length)}
          className="rounded-full min-w-[32px] h-8 w-8 absolute right-1 top-1 p-0 bg-red-500 hover:bg-red-600 text-white"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;