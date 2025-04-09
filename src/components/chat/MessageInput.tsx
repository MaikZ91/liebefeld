
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Paperclip, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { EventShare } from '@/types/chatTypes';

interface MessageInputProps {
  username: string;
  groupId: string;
  handleSendMessage: (eventData?: any) => Promise<void>;
  isEventSelectOpen: boolean;
  setIsEventSelectOpen: (open: boolean) => void;
  eventSelectContent: React.ReactNode;
  isSending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  username, 
  groupId, 
  handleSendMessage, 
  isEventSelectOpen, 
  setIsEventSelectOpen,
  eventSelectContent,
  isSending 
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      supabase
        .channel(`typing:${groupId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem('community_chat_avatar'),
            isTyping: true
          }
        });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        supabase
          .channel(`typing:${groupId}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              username,
              avatar: localStorage.getItem('community_chat_avatar'),
              isTyping: false
            }
          });
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (newMessage.trim() || fileInputRef.current?.files?.length) {
      await handleSendMessage();
      setNewMessage("");
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

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <Textarea 
          placeholder="Schreibe eine Nachricht..." 
          value={newMessage}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          className="min-h-[50px] flex-grow resize-none"
        />
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleFileUpload} 
            variant="outline"
            size="icon"
            type="button"
            className="rounded-full"
            title="Bild anhängen"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Popover 
            open={isEventSelectOpen} 
            onOpenChange={setIsEventSelectOpen}
          >
            <PopoverTrigger asChild>
              <Button 
                onClick={handleShareEvent} 
                variant="outline"
                size="icon"
                type="button"
                className="rounded-full"
                title="Event teilen"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0 max-h-[400px] overflow-y-auto" 
              side="top" 
              align="end"
              sideOffset={5}
            >
              {eventSelectContent}
            </PopoverContent>
          </Popover>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={() => {}}
        />
        <Button 
          onClick={handleSubmit} 
          disabled={isSending || (!newMessage.trim() && !fileInputRef.current?.files?.length)}
          className="rounded-full min-w-[40px]"
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
