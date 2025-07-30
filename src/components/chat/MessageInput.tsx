// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ChevronDown, Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { messageService } from '@/services/messageService';
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  username: string;
  groupId: string;
  handleSendMessage: (eventData?: any) => Promise<void>;
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
  const { toast } = useToast();

  // Sicherstellen, dass wir eine gültige UUID für groupId haben
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    } else {
      setNewMessage(e.target.value);
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
    // Only used for Enter key when no external onKeyDown handler is provided
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

  const handleSendButtonClick = async () => {
    // Direct handler for send button to avoid double submission
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

  const handleCategoryClick = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
    // Synchronisiere den Filter mit der ausgewählten Kategorie beim Senden von Nachrichten
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category } }));
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      const token = await initializeFCM();
      if (token) {
        // Token in Datenbank speichern
        const { error } = await supabase
          .from('push_tokens')
          .insert({ token });

        if (error) {
          console.error('Error saving push token:', error);
          toast({
            title: "Fehler",
            description: "Push-Token konnte nicht gespeichert werden.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erfolgreich!",
            description: "Push-Benachrichtigungen wurden aktiviert.",
          });
        }
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast({
        title: "Fehler",
        description: "Push-Benachrichtigungen konnten nicht aktiviert werden.",
        variant: "destructive"
      });
    }
  };

  // Dynamisches padding-left basierend auf dem Modus
  const leftPadding = mode === 'community' ? 'pl-[100px]' : 'pl-4';

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 relative">
        <Textarea
          placeholder={placeholder}
          value={value !== undefined ? value : newMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className={`min-h-[50px] flex-grow resize-none pr-14 border-2 border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500 shadow-md shadow-red-500/10 transition-all duration-200 placeholder-red-500 ${leftPadding}`}
        />
        {/* Buttons auf der linken Seite des Inputs (absolute Positionierung) */}
        {mode === 'community' && ( // Only show in community mode
          <div className="flex items-center gap-1 absolute left-1 top-1 z-10">
            {/* Kategorie-Dropdown (jetzt erster) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10 flex items-center gap-1 min-w-[70px] bg-white/90 dark:bg-zinc-800/90"
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
                    activeCategory === 'Kr' && "bg-red-500/20"
                  )}
                >
                  Kre
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

            {/* Push Notification Button */}
            <Button
              onClick={handleEnablePushNotifications}
              variant="outline"
              size="icon"
              type="button"
              className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10 bg-white/90 dark:bg-zinc-800/90"
              title="Push-Benachrichtigungen aktivieren"
            >
              <Bell className="h-3 w-3" />
            </Button>
          </div>
        )}
        {/* Send button on the right */}
        <Button
          onClick={handleSendButtonClick}
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