// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ChevronDown, Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { messageService } from '@/services/messageService';
import { initializeFCM, disableFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { getChannelColor } from '@/utils/channelColors';

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
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('fcm_token') : false;
      setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted' && hasToken);
    } catch {
      setPushEnabled(false);
    }
  }, []);

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
      if (typeof Notification === 'undefined') {
        toast({
          title: "Nicht unterstützt",
          description: "Benachrichtigungen werden von diesem Browser nicht unterstützt.",
          variant: "destructive"
        });
        return;
      }

      if (!pushEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await initializeFCM();
          if (token) {
            try { localStorage.setItem('fcm_token', token); } catch {}
            setPushEnabled(true);
            toast({ title: "Aktiviert", description: "Push-Benachrichtigungen wurden aktiviert." });
          } else {
            toast({ title: "Fehler", description: "Token konnte nicht geholt werden.", variant: "destructive" });
          }
        } else if (permission === 'denied') {
          toast({ title: "Blockiert", description: "Bitte aktiviere Benachrichtigungen in den Browser-Einstellungen.", variant: "destructive" });
        }
      } else {
        const ok = await disableFCM();
        if (ok) {
          setPushEnabled(false);
          toast({ title: "Deaktiviert", description: "Push-Benachrichtigungen wurden deaktiviert." });
        } else {
          toast({ title: "Fehler", description: "Deaktivierung fehlgeschlagen.", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast({ title: "Fehler", description: "Unerwarteter Fehler beim Umschalten.", variant: "destructive" });
    }
  };

  // Dynamisches padding-left basierend auf dem Modus
  const leftPadding = mode === 'community' ? 'pl-[100px]' : 'pl-4';
  
  // Get channel-specific colors
  const colors = getChannelColor(groupType);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 relative">
        <Textarea
          placeholder={placeholder}
          value={value !== undefined ? value : newMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-[50px] flex-grow resize-none pr-14 border-2 transition-all duration-200",
            leftPadding
          )}
          style={{
            ...colors.borderStyle,
            ...colors.shadowStyle,
            '--placeholder-color': colors.primary
          } as React.CSSProperties & { '--placeholder-color': string }}
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
                  className="rounded-full h-6 px-2 text-[10px] flex items-center gap-1 min-w-[70px] bg-white/90 dark:bg-zinc-800/90"
                  style={colors.borderStyle}
                >
                  {activeCategory}
                  <ChevronDown className="h-2 w-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-zinc-900 z-50"
                style={colors.borderStyle}
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

            <Button
              onClick={handleEnablePushNotifications}
              variant="outline"
              size="icon"
              type="button"
              className="rounded-full h-6 w-6 bg-white/90 dark:bg-zinc-800/90"
              style={colors.borderStyle}
              title={pushEnabled ? "Push aktiviert – klicken zum Deaktivieren" : "Push-Benachrichtigungen aktivieren"}
            >
              <Bell className={cn("h-3 w-3", pushEnabled ? "text-primary" : "text-muted-foreground")} />
            </Button>
          </div>
        )}
        {/* Send button on the right */}
        <Button
          onClick={handleSendButtonClick}
          disabled={isSending || (!value?.trim() && !newMessage.trim())}
          className="rounded-full min-w-[32px] h-8 w-8 absolute right-1 top-1 p-0 text-white"
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
  );
};

export default MessageInput;