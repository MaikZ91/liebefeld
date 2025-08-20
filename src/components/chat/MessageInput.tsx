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
    console.log('MessageInput: changing category to', category);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
    // Save to localStorage
    try {
      import('@/utils/chatPreferences').then(({ saveActiveCategory }) => {
        saveActiveCategory(category);
      });
    } catch (error) {
      console.error('MessageInput: error saving category preference:', error);
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

  // Dynamisches padding-left basierend auf dem Modus
  const leftPadding = mode === 'community' ? 'pl-[100px]' : 'pl-4';
  
  // Get channel-specific colors for liquid glass effect
  const getInputColors = (type: string) => {
    switch (type) {
      case 'sport': 
        return { 
          bg: 'linear-gradient(135deg, rgba(54, 144, 255, 0.08) 0%, rgba(54, 144, 255, 0.05) 100%)', 
          border: 'rgba(54, 144, 255, 0.2)',
          glow: 'rgba(54, 144, 255, 0.1)'
        };
      case 'kreativität': 
        return { 
          bg: 'linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 193, 7, 0.05) 100%)', 
          border: 'rgba(255, 193, 7, 0.2)',
          glow: 'rgba(255, 193, 7, 0.1)'
        };
      case 'ausgehen': 
        return { 
          bg: 'linear-gradient(135deg, rgba(255, 77, 77, 0.08) 0%, rgba(255, 77, 77, 0.05) 100%)', 
          border: 'rgba(255, 77, 77, 0.2)',
          glow: 'rgba(255, 77, 77, 0.1)'
        };
      default: 
        return { 
          bg: 'linear-gradient(135deg, rgba(255, 77, 77, 0.08) 0%, rgba(255, 77, 77, 0.05) 100%)', 
          border: 'rgba(255, 77, 77, 0.2)',
          glow: 'rgba(255, 77, 77, 0.1)'
        };
    }
  };
  
  const inputColors = getInputColors(groupType);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 relative">
        <Textarea
          placeholder={placeholder}
          value={value !== undefined ? value : newMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-[50px] flex-grow resize-none pr-14 transition-all duration-200 text-white border-0",
            leftPadding,
            "focus:ring-0 focus:outline-none"
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
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
                  className="rounded-full h-6 px-2 text-[10px] flex items-center gap-1 min-w-[70px] text-white border-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(15px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(15px) saturate(180%)'
                  }}
                >
                  {activeCategory}
                  <ChevronDown className="h-2 w-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="z-[99999] border-0 fixed"
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  position: 'fixed'
                }}
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

            {/* Push Notification Button */}
            <Button
              onClick={handleEnablePushNotifications}
              variant="outline"
              size="icon"
              type="button"
              className="rounded-full h-6 w-6 text-white border-0"
              style={{
                background: 'rgba(255, 140, 0, 0.2)',
                border: '1px solid rgba(255, 140, 0, 0.3)',
                backdropFilter: 'blur(15px)'
              }}
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
          className="rounded-full min-w-[32px] h-8 w-8 absolute right-1 top-1 p-0 text-white border-0"
          style={{
            background: 'linear-gradient(45deg, #FF8C00, #FF4500)',
            boxShadow: '0 4px 12px rgba(255, 140, 0, 0.4)'
          }}
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