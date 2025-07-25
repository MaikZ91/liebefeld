// src/components/chat/MentionInput.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, X, Reply, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chatTypes';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface MentionInputProps {
  username: string;
  groupId: string;
  onSendMessage: (text: string, replyToId?: string, mentions?: string[]) => Promise<void>;
  isSending: boolean;
  placeholder?: string;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
}

interface UserSuggestion {
  username: string;
  avatar: string | null;
}

const MentionInput: React.FC<MentionInputProps> = ({
  username,
  groupId,
  onSendMessage,
  isSending,
  placeholder = "Schreibe eine Nachricht...",
  replyToMessage,
  onCancelReply
}) => {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(0);
  const [currentMention, setCurrentMention] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivLement>(null);

  // Debounce function
  const debounce = useRef<NodeJS.Timeout>();
  const debounceDelay = 300; // milliseconds

  // Fetch users for suggestions
  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, avatar')
        .ilike('username', `%${query}%`)
        .neq('username', username) // Exclude current user
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSuggestions([]);
    }
  }, [username]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    // Clear previous debounce timeout
    if (debounce.current) {
      clearTimeout(debounce.current);
    }

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStart(lastAtSymbol);
        setCurrentMention(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);

        // Debounce the fetchUsers call
        debounce.current = setTimeout(() => {
          fetchUsers(textAfterAt);
        }, debounceDelay);
      } else {
        setShowSuggestions(false);
        setSuggestions([]); // Clear suggestions if mention context is lost
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]); // Clear suggestions if no @ symbol
    }
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: UserSuggestion) => {
    const beforeMention = message.substring(0, mentionStart);
    const afterMention = message.substring(mentionStart + currentMention.length + 1);
    const newMessage = `${beforeMention}@${suggestion.username} ${afterMention}`;
    
    setMessage(newMessage);
    setShowSuggestions(false);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + suggestion.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Extract mentions from message
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (message.trim() && !isSending) {
      const mentions = extractMentions(message);
      await onSendMessage(
        message,
        replyToMessage?.id,
        mentions.length > 0 ? mentions : undefined
      );
      setMessage("");
      setShowSuggestions(false);
    }
  };

  // Render message with highlighted mentions
  const renderMessagePreview = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounce.current) {
        clearTimeout(debounce.current);
      }
    };
  }, []);

  return (
    <div className="w-full space-y-2 relative">
      {/* Reply indicator */}
      {replyToMessage && (
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-l-4 border-blue-500">
          <Reply className="h-4 w-4 text-blue-500" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              Antwort an {replyToMessage.user_name}:
            </span>
            <div className="text-gray-600 dark:text-gray-300 truncate">
              {replyToMessage.text}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-[60px] resize-none pr-14 border-2 border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500",
            replyToMessage && "rounded-t-none"
          )}
        />

        {/* Send button */}
        <Button
          onClick={handleSubmit}
          disabled={isSending || !message.trim()}
          className="rounded-full min-w-[32px] h-8 w-8 absolute right-2 bottom-2 p-0 bg-red-500 hover:bg-red-600 text-white"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>

        {/* Mention suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
          >
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <AtSign className="h-3 w-3 inline mr-1" />
              Nutzer erwähnen
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.username}
                className={cn(
                  "flex items-center gap-2 p-2 cursor-pointer transition-colors",
                  index === selectedIndex 
                    ? "bg-blue-100 dark:bg-blue-900/50" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                onClick={() => selectSuggestion(suggestion)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={suggestion.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {suggestion.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">@{suggestion.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message preview with mentions highlighted */}
      {message && extractMentions(message).length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
          Vorschau: {renderMessagePreview(message)}
        </div>
      )}
    </div>
  );
};

export default MentionInput;