import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { messageService } from '@/services/messageService';
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { getChannelColor } from '@/utils/channelColors';
import { useEventContext } from '@/contexts/EventContext';
import { useChatPreferences } from '@/contexts/ChatPreferencesContext';
import { ReplyData } from '@/hooks/chat/useReplySystem';
import ReplyPreview from './ReplyPreview';
import { chatMediaService } from '@/services/chatMediaService';

interface MessageInputProps {
  username: string;
  groupId: string;
  handleSendMessage: (eventData?: any, mediaUrl?: string | null) => Promise<void>;
  isSending: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  mode?: 'ai' | 'community';
  groupType?: 'ausgehen' | 'sport' | 'kreativität';
  replyTo?: ReplyData | null;
  onClearReply?: () => void;
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
  groupType = 'ausgehen',
  replyTo,
  onClearReply
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { selectedCity } = useEventContext();
  const { activeCategory } = useChatPreferences();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Sync internal state with external value prop
  useEffect(() => {
    if (value !== undefined && value !== newMessage) {
      console.log('MessageInput: syncing internal state with external value', { value, newMessage });
      setNewMessage(value);
    }
  }, [value]);

  // Focus textarea when a reply starts
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);
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

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fehler",
        description: "Nur Bilder können hochgeladen werden",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fehler",
        description: "Das Bild ist zu groß. Maximale Größe: 5MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendButtonClick = async () => {
    console.log('MessageInput: handleSendButtonClick called', { 
      value, 
      newMessage, 
      valueTrim: value?.trim(), 
      newMessageTrim: newMessage.trim(),
      isSending,
      hasImage: !!selectedImage
    });
    
    // Allow sending if there's text OR an image
    if ((!value?.trim() && !newMessage.trim() && !selectedImage) || isSending || isUploading) {
      console.log('MessageInput: early return - empty message/no image or sending');
      return;
    }
    
    try {
      let mediaUrl: string | null = null;
      
      // Upload image if selected
      if (selectedImage) {
        setIsUploading(true);
        try {
          mediaUrl = await chatMediaService.uploadChatImage(selectedImage);
          console.log('MessageInput: Image uploaded:', mediaUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: "Fehler",
            description: "Bild konnte nicht hochgeladen werden",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      
      console.log('MessageInput: calling handleSendMessage with mediaUrl:', mediaUrl);
      await handleSendMessage(undefined, mediaUrl);
      console.log('MessageInput: handleSendMessage completed, resetting...');
      
      // Reset internal message state only if no external value is controlled
      if (value === undefined) {
        console.log('MessageInput: resetting internal newMessage state');
        setNewMessage("");
      } else {
        console.log('MessageInput: value is controlled externally, not resetting internal state');
      }
      
      // Clear image after sending
      clearImage();
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
    <div className="flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      
      {/* Reply preview */}
      {replyTo && onClearReply && (
        <ReplyPreview replyTo={replyTo} onCancel={onClearReply} groupType={groupType} />
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-h-32 rounded-lg border border-white/20"
          />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-black/80 rounded-full p-1 hover:bg-black transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
      
      <div className="relative flex items-center gap-2">
        {/* Image upload button */}
        {mode === 'community' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "h-8 w-8 rounded-full shrink-0 transition-all duration-200",
              "text-white border hover:bg-white/10"
            )}
            style={{
              backgroundColor: 'transparent',
              borderColor: inputColors.border,
              boxShadow: inputColors.glow,
            }}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={value !== undefined ? value : newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "min-h-[32px] max-h-[88px] resize-none rounded-full py-1.5 text-sm leading-5",
              "border focus:ring-0 focus:ring-offset-0",
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
          disabled={isSending || isUploading || (value === undefined ? (!newMessage.trim() && !selectedImage) : !value?.trim())}
          className={cn(
            "h-8 w-8 rounded-full transition-all duration-200 shrink-0",
            mode === 'ai' 
              ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
              : "text-white border hover:bg-white/10"
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
          {isSending || isUploading ? (
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