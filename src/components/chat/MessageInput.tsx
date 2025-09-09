import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { messageService } from '@/services/messageService';
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { getChannelColor } from '@/utils/channelColors';
import { useEventContext } from '@/contexts/EventContext';
import { useChatPreferences } from '@/contexts/ChatPreferencesContext';

interface MessageInputProps {
  username: string;
  groupId: string;
  handleSendMessage: (eventData?: any) => Promise<void>;
  isSending: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  mode?: 'ai' | 'community';
  groupType?: 'ausgehen' | 'sport' | 'kreativität';
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
  mode = 'community',
  groupType = 'ausgehen'
}) => {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const { selectedCity } = useEventContext();
  const { activeCategory } = useChatPreferences();

  // Sync internal state with external value prop
  useEffect(() => {
    if (value !== undefined && value !== newMessage) {
      console.log('MessageInput: syncing internal state with external value', { value, newMessage });
      setNewMessage(value);
    }
  }, [value]);

  // Sicherstellen, dass wir eine gültige UUID für groupId haben
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(e);
    } else {
      setNewMessage(newValue);
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
    console.log('MessageInput: handleSendButtonClick called', { 
      value, 
      newMessage, 
      valueTrim: value?.trim(), 
      newMessageTrim: newMessage.trim(),
      isSending 
    });
    
    if ((!value?.trim() && !newMessage.trim()) || isSending) {
      console.log('MessageInput: early return - empty message or sending');
      return;
    }
    
    try {
      console.log('MessageInput: calling handleSendMessage');
      await handleSendMessage();
      console.log('MessageInput: handleSendMessage completed, resetting...');
      
      // Reset internal message state only if no external value is controlled
      if (value === undefined) {
        console.log('MessageInput: resetting internal newMessage state');
        setNewMessage("");
      } else {
        console.log('MessageInput: value is controlled externally, not resetting internal state');
      }
    } catch (error) {
      console.error('Error in message submission:', error);
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

  // Determine current group type based on active category
  const currentGroupType = activeCategory === 'sport' ? 'sport' : 
                          activeCategory === 'kreativität' ? 'kreativität' : 
                          'ausgehen';

  // Get channel-specific colors for liquid glass effect
  const getInputColors = (type: 'ausgehen' | 'sport' | 'kreativität') => {
    const colors = getChannelColor(type);
    return {
      background: 'rgba(0, 0, 0, 0.95)',
      border: colors.borderStyle.borderColor,
      glow: `0 0 20px ${colors.borderStyle.borderColor}40`,
      focusGlow: `0 0 30px ${colors.borderStyle.borderColor}60`
    };
  };
  
  const inputColors = getInputColors(currentGroupType);

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex-1">
        <Textarea
          value={value !== undefined ? value : newMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none rounded-full",
            "border-2 focus:ring-0 focus:ring-offset-0",
            mode === 'ai' 
              ? "bg-background border-border text-foreground focus:border-primary" 
              : "text-white placeholder:text-gray-400 transition-all duration-200"
          )}
          style={
            mode === 'community'
              ? {
                  backgroundColor: inputColors.background,
                  borderColor: inputColors.border,
                  boxShadow: inputColors.glow,
                }
              : undefined
          }
        />
      </div>

      {/* Send button */}
      <Button
        onClick={handleSendButtonClick}
        disabled={isSending || (value === undefined ? !newMessage.trim() : !value?.trim())}
        className={cn(
          "h-10 w-10 rounded-full transition-all duration-200",
          mode === 'ai' 
            ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
            : "text-white border-2 hover:bg-white/10"
        )}
        style={
          mode === 'community'
            ? {
                backgroundColor: 'transparent',
                borderColor: inputColors.border,
                boxShadow: inputColors.glow,
              }
            : undefined
        }
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default MessageInput;