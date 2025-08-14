// src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, History, CalendarPlus, Send, Calendar, ChevronDown, Mic, ImagePlus } from 'lucide-react';
import { ChatInputProps } from './types';
import { useEventContext } from '@/contexts/EventContext';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { supabase } from "@/integrations/supabase/client";
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { getChannelColor } from '@/utils/channelColors';

const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <span key={text} className={cn("inline-block whitespace-nowrap overflow-hidden animate-typing", className)}>
      {text}
    </span>
  );
};

interface ExtendedChatInputProps extends ChatInputProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  placeholder?: string; // Add placeholder prop
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
}

const ChatInput: React.FC<ExtendedChatInputProps> = ({
  input,
  setInput,
  handleSendMessage,
  isTyping,
  onKeyDown,
  onChange,
  isHeartActive,
  handleHeartClick,
  globalQueries,
  toggleRecentQueries,
  inputRef,
  onAddEvent,
  showAnimatedPrompts,
  activeChatModeValue,
  activeCategory = 'Ausgehen',
  onCategoryChange,
  placeholder, // Receive placeholder prop
  onJoinEventChat
}) => {
  const miaAvatarUrl = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png'
  const { events, selectedCity } = useEventContext();
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [localInput, setLocalInput] = useState(input);
  const { toast } = useToast();

  // Reference for the textarea to dynamically adjust height
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalInput(input);
  }, [input]);

  // Effect to adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // Set height to scrollHeight
    }
  }, [localInput]); // Re-run when localInput changes

  const suggestions = [];

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const loopTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!showAnimatedPrompts || suggestions.length === 0) {
      setDisplayText('');
      return;
    }

    if (localInput.trim() !== '') {
      setDisplayText('');
      return;
    }

    const currentSuggestion = suggestions[currentSuggestionIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentSuggestion.length) {
          setDisplayText(currentSuggestion.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentSuggestionIndex, localInput, suggestions, showAnimatedPrompts]);

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalInput(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const handleLocalSendMessage = async (eventData?: any) => {
    console.log('ChatInput.handleLocalSendMessage called', { activeChatModeValue, localInput, eventData });
    
    if (!localInput.trim() && !eventData) return; // Prevent empty sends
    
    if (activeChatModeValue === 'community') {
      // For community mode, ONLY update external input - parent handles sending
      console.log('Community mode: updating external input only');
      setInput(localInput);
      setLocalInput(''); // Clear local input after updating external
      return;
    }
    
    // For AI mode, handle sending directly
    console.log('AI mode: handling send directly');
    setInput(localInput);
    await handleSendMessage(eventData || localInput);
    setLocalInput('');
  };
  
  const handleLocalKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter pressed in ChatInput', { activeChatModeValue, localInput });
      
      if (activeChatModeValue === 'community') {
        // For community mode, ONLY update external input - let parent handle sending
        console.log('Community mode: Enter key - updating external input only');
        setInput(localInput);
        setLocalInput('');
      } else {
        console.log('AI mode: Enter key - handling send directly');
        handleLocalSendMessage();
      }
    } else {
      if (onKeyDown) {
        onKeyDown(e);
      }
    }
  };

  const handleSuggestionClick = () => {
    if (localInput.trim() === '' && displayText.trim() !== '') {
      setLocalInput(displayText);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const getDynamicPlaceholder = () => {
    if (activeChatModeValue === 'ai') {
      return placeholder || (showAnimatedPrompts && localInput.trim() === '' ? displayText : "Frage nach Events...");
    } else {
      return "Schreibe hier...";
    }
  };

  const placeholderText = getDynamicPlaceholder();

  const handleCategoryClick = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, 0);
  };

  // Get channel colors based on active category
  const getGroupType = (category: string): 'ausgehen' | 'sport' | 'kreativität' => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('sport')) return 'sport';
    if (lowerCategory.includes('kreativität')) return 'kreativität';
    return 'ausgehen';
  };
  
  const groupType = getGroupType(activeCategory);
  const colors = getChannelColor(groupType);

  return (
    <div className="w-full px-4 pb-6">
      <div className="bg-background/95 backdrop-blur-sm rounded-3xl border shadow-lg p-1" style={activeChatModeValue === 'community' ? colors.borderStyle : { borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2 relative">
          {/* Left side icons */}
          {activeChatModeValue === 'ai' ? (
            <div className="flex items-center gap-2 pl-3">
              {/* MIA Avatar */}
              <Avatar className="h-8 w-8 border-2 border-white/50">
                <AvatarImage src={miaAvatarUrl} />
              </Avatar>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHeartClick}
                className={`h-8 w-8 rounded-full hover:bg-muted ${isHeartActive ? 'text-red-500' : 'text-red-400'}`}
                title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
              >
                <Heart className={`h-4 w-4 ${isHeartActive ? 'fill-red-500' : ''}`} />
              </Button>

              {globalQueries.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecentQueries}
                  className="h-8 w-8 rounded-full hover:bg-muted text-red-400"
                  title="Community Anfragen"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}

              {onAddEvent && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddEvent}
                  className="h-8 w-8 rounded-full hover:bg-muted text-red-400"
                  title="Event hinzufügen"
                >
                  <CalendarPlus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
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
              ref={textareaRef}
              placeholder={placeholderText}
              value={localInput}
              onChange={handleLocalInputChange}
              onKeyDown={handleLocalKeyPress}
              rows={1}
              className={cn(
                "min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                activeChatModeValue === 'ai' && "pl-4"
              )}
              style={{
                '--placeholder-color': activeChatModeValue === 'community' ? colors.primary : 'hsl(var(--muted-foreground))'
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
              style={{ color: activeChatModeValue === 'community' ? colors.primary : 'hsl(var(--muted-foreground))' }}
              title="Sprachnachricht"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={() => {
                console.log('Send button clicked in ChatInput', { activeChatModeValue, localInput });
                
                if (activeChatModeValue === 'community') {
                  // For community mode, ONLY update external input - let parent handle sending
                  console.log('Community mode: Send button - updating external input only');
                  setInput(localInput);
                  setLocalInput('');
                } else {
                  // For AI mode, use local send
                  console.log('AI mode: Send button - handling send directly');
                  handleLocalSendMessage();
                }
              }}
              disabled={!localInput.trim() || isTyping}
              size="icon"
              className="h-8 w-8 rounded-full text-white shadow-sm disabled:opacity-50"
              style={localInput.trim() && !isTyping
                ? (activeChatModeValue === 'community' ? colors.bgStyle : { backgroundColor: 'hsl(var(--primary))' })
                : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
              }
            >
              {isTyping ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
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

export default ChatInput;