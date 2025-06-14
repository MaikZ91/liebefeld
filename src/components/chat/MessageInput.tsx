// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { EventShare } from '@/types/chatTypes';
import { messageService } from '@/services/messageService';
import { useEventContext } from '@/contexts/EventContext';

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
  onCategorySelect?: (category: string) => void; // Hinzugefügte Prop
  activeCategory?: string; // Active category prop
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
  mode = 'community', // Default to community mode
  onCategorySelect, // Hinzugefügte Prop
  activeCategory = 'Ausgehen' // Default category changed to Ausgehen
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { events } = useEventContext(); // Zugriff auf Events

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
    if (messageToSend.trim() && !isSending) {
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

  const handleShareEvent = () => {
    setIsEventSelectOpen(true);
  };

  const handleCategoryClick = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  // Event-Inhalt für das Popover
  const realEventSelectContent = (
    <div className="max-h-[300px] overflow-y-auto">
      {events && events.length > 0 ? (
        <div className="space-y-2 p-2">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Events auswählen
          </div>
          {events.map((event) => (
            <div
              key={event.id}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
              onClick={() => {
                // Event-Daten in die Nachricht einfügen
                const eventMessage = `Schaut euch dieses Event an: ${event.title} am ${event.date} um ${event.time} in ${event.location}`;
                if (onChange) {
                  // Simuliere ein change event
                  const fakeEvent = { target: { value: eventMessage } } as React.ChangeEvent<HTMLTextAreaElement>;
                  onChange(fakeEvent);
                } else {
                  setNewMessage(eventMessage);
                }
                setIsEventSelectOpen(false);
              }}
            >
              <div className="font-medium text-sm">{event.title}</div>
              <div className="text-xs text-gray-500">
                {event.date} • {event.location}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-sm text-gray-500 text-center">
          Keine Events verfügbar
        </div>
      )}
    </div>
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Dynamisches padding-left basierend auf dem Modus
  const leftPadding = mode === 'community' ? 'pl-[100px]' : 'pl-4'; 

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
        {/* Buttons auf der linken Seite des Inputs (absolute Positionierung) */}
        {mode === 'community' && ( // Only show in community mode
          <div className="flex items-center gap-1 absolute left-1 top-1">
            {/* Kategorie-Dropdown (jetzt zuerst) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10 flex items-center gap-1 min-w-[70px]"
                >
                  {activeCategory}
                  <ChevronDown className="h-2 w-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="bg-zinc-900 border-red-500/30 z-50"
                side="top"
                align="start"
              >
                <DropdownMenuItem
                  onClick={() => handleCategoryClick('Kreativität')}
                  className={cn(
                    "text-white hover:bg-red-500/20 cursor-pointer",
                    activeCategory === 'Kreativität' && "bg-red-500/20"
                  )}
                >
                  Kreativität
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCategoryClick('Ausgehen')}
                  className={cn(
                    "text-white hover:bg-red-500/20 cursor-pointer",
                    activeCategory === 'Ausgehen' && "bg-red-500/20"
                  )}
                >
                  Ausgehen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCategoryClick('Sport')}
                  className={cn(
                    "text-white hover:bg-red-500/20 cursor-pointer",
                    activeCategory === 'Sport' && "bg-red-500/20"
                  )}
                >
                  Sport
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Event teilen Button (jetzt zweiter) */}
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
                align="start"
                sideOffset={5}
              >
                {realEventSelectContent}
              </PopoverContent>
            </Popover>
          </div>
        )}
        {/* Send button on the right */}
        <Button
          onClick={handleSubmit}
          disabled={isSending || (!value?.trim() && !newMessage.trim())}
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
