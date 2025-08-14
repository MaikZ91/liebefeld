// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ChevronDown, Mic, ImagePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { messageService } from '@/services/messageService';
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { getChannelColor } from '@/utils/channelColors';
import { useEventContext } from '@/contexts/EventContext';

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
  groupType?: 'ausgehen' | 'sport' | 'kreativität'; // Channel type for colors
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
  activeCategory = 'Ausgehen', // Default category changed to Ausgehen
  groupType = 'ausgehen' // Default group type
}) => {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const { selectedCity } = useEventContext();

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

    // Fallback nur wenn kein externer onKeyDown Handler vorhanden ist
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendButtonClick();
    }
  };

  const handleSendButtonClick = async () => {
    if ((!value?.trim() && !newMessage.trim()) || isSending) {
      return;
    }
    
    try {
      await handleSendMessage();
      if (value === undefined) {
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error in message submission:', error);
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
      const token = await initializeFCM(selectedCity, true);
      if (token) {
        toast({
          title: "Erfolgreich!",
          description: "Push-Benachrichtigungen wurden aktiviert.",
        });
      } else {
        toast({
          title: "Fehler",
          description: "Push-Benachrichtigungen konnten nicht aktiviert werden.",
          variant: "destructive"
        });
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

  // Get channel-specific colors
  const colors = getChannelColor(groupType);

  return (
    <div className="w-full px-4 pb-6">
      <div className="bg-background/95 backdrop-blur-sm rounded-3xl border shadow-lg p-1" style={colors.borderStyle}>
        <div className="flex items-center gap-2 relative">
          {/* Left side icons */}
          {mode === 'community' && (
            <div className="flex items-center gap-2 pl-3">
              {/* Category Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs rounded-full bg-muted/50 hover:bg-muted"
                    style={{ color: colors.primary }}
                  >
                    #{activeCategory.toLowerCase()}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-zinc-900 border-zinc-700"
                  side="top"
                  align="start"
                >
                  <DropdownMenuItem
                    onClick={() => handleCategoryClick('Kreativität')}
                    className="text-white cursor-pointer hover:bg-zinc-800"
                  >
                    <span style={getChannelColor('kreativität').textStyle}>#kreativität</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCategoryClick('Ausgehen')}
                    className="text-white cursor-pointer hover:bg-zinc-800"
                  >
                    <span style={getChannelColor('ausgehen').textStyle}>#ausgehen</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCategoryClick('Sport')}
                    className="text-white cursor-pointer hover:bg-zinc-800"
                  >
                    <span style={getChannelColor('sport').textStyle}>#sport</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Image upload button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                style={{ color: colors.primary }}
                title="Bild hinzufügen"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Input field */}
          <div className="flex-1 relative">
            <Textarea
              placeholder={placeholder}
              value={value !== undefined ? value : newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                mode === 'ai' && "pl-4"
              )}
              style={{
                '--placeholder-color': colors.primary
              } as React.CSSProperties & { '--placeholder-color': string }}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 pr-3">
            {/* Microphone button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              style={{ color: colors.primary }}
              title="Sprachnachricht"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSendButtonClick}
              disabled={isSending || (!value?.trim() && !newMessage.trim())}
              size="icon"
              className="h-8 w-8 rounded-full text-white shadow-sm disabled:opacity-50"
              style={colors.bgStyle}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;