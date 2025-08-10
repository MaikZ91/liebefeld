// src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, History, CalendarPlus, Send, Calendar, ChevronDown, Bell } from 'lucide-react';
import { ChatInputProps } from './types';
import { useEventContext } from '@/contexts/EventContext';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { supabase } from "@/integrations/supabase/client";
import EmojiPicker from '@/components/chat/EmojiPicker';
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
  const { events } = useEventContext();
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [localInput, setLocalInput] = useState(input);
  const { toast } = useToast();

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

  // ---- Hashtag Autocomplete (categories) ----
  const HASHTAG_OPTIONS = [
    { label: '#kreativität', value: 'kreativität' as const },
    { label: '#ausgehen', value: 'ausgehen' as const },
    { label: '#sport', value: 'sport' as const },
  ];

  const [tagQuery, setTagQuery] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [filteredTags, setFilteredTags] = useState(HASHTAG_OPTIONS);
  const tagCtxRef = useRef<{ start: number; end: number } | null>(null);

  const getCaretPos = () => {
    const el = textareaRef.current;
    if (!el) return localInput.length;
    return el.selectionStart ?? localInput.length;
  };

  const computeTagContext = () => {
    const pos = getCaretPos();
    const left = localInput.slice(0, pos);
    const match = left.match(/(^|\s)(#[^\s#@]*)$/);
    if (match) {
      const token = match[2] || '';
      const start = pos - token.length;
      return { start, end: pos, query: token.slice(1) };
    }
    return null;
  };

  const updateTagSuggestions = () => {
    const ctx = computeTagContext();
    if (!ctx || ctx.query.length === 0) {
      setShowTagSuggestions(false);
      tagCtxRef.current = null;
      return;
    }
    tagCtxRef.current = { start: ctx.start, end: ctx.end };
    const q = ctx.query.toLowerCase();
    const next = HASHTAG_OPTIONS.filter((o) => o.value.startsWith(q));
    setFilteredTags(next);
    setActiveTagIndex(0);
    setTagQuery(q);
    setShowTagSuggestions(next.length > 0);
  };

  const applyTag = (value: 'kreativität' | 'ausgehen' | 'sport') => {
    if (!tagCtxRef.current) return;
    const el = textareaRef.current;
    const { start, end } = tagCtxRef.current;
    const before = localInput.slice(0, start);
    const after = localInput.slice(end);
    const inserted = `#${value} `;
    const next = before + inserted + after;
    setLocalInput(next);
    setShowTagSuggestions(false);
    setTimeout(() => {
      if (el) {
        const caret = (before + inserted).length;
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setLocalInput((prev) => prev + text);
      return;
    }
    const start = el.selectionStart ?? localInput.length;
    const end = el.selectionEnd ?? localInput.length;
    const next = localInput.slice(0, start) + text + localInput.slice(end);
    setLocalInput(next);
    setTimeout(() => {
      const pos = start + text.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 0);
  };
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const loopTimeout = useRef<NodeJS.Timeout | null>(null);

  const suggestions: string[] = [];

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
    updateTagSuggestions();
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
    // Hashtag suggestions keyboard navigation
    if (showTagSuggestions) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveTagIndex((prev) => {
          const max = filteredTags.length;
          if (e.key === 'ArrowDown') return (prev + 1) % max;
          return (prev - 1 + max) % max;
        });
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        const tag = filteredTags[activeTagIndex];
        if (tag) applyTag(tag.value);
        return;
      }
      if (e.key === 'Escape') {
        setShowTagSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter pressed in ChatInput', { activeChatModeValue, localInput });
      if (activeChatModeValue === 'community') {
        console.log('Community mode: Enter key - updating external input only');
        setInput(localInput);
        setLocalInput('');
      } else {
        console.log('AI mode: Enter key - handling send directly');
        handleLocalSendMessage();
      }
    } else {
      if (onKeyDown) onKeyDown(e);
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

  const eventSelectContent = (
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
                handleLocalSendMessage({
                  title: event.title,
                  date: event.date,
                  time: event.time,
                  location: event.location,
                  category: event.category
                });
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

  const getButtonWidth = () => {
    if (activeChatModeValue === 'community') {
      return 'pl-[120px]';
    } else {
      const baseButtons = 2;
      const historyButton = globalQueries.length > 0 ? 1 : 0;
      const totalButtons = baseButtons + historyButton;
      return 'pl-[110px]';
    }
  };

  return (
    <div className="flex items-center relative w-full max-w-md">
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                {/* MIA Avatar (only shown in AI chat mode) */}
        {activeChatModeValue === 'ai' && (
          <Avatar className="h-8 w-8 border-2 border-white/50">
            <AvatarImage src={miaAvatarUrl} />
          </Avatar>
        )}
        
        {activeChatModeValue === 'ai' ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHeartClick}
              className={`h-6 w-6 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`}
              title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
            >
              <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-red-500' : ''}`} />
            </Button>

            {globalQueries.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRecentQueries}
                className="h-6 w-6 text-red-400"
                title="Community Anfragen"
              >
                <History className="h-3 w-3" />
              </Button>
            )}

            {onAddEvent && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onAddEvent}
                className="h-6 w-6 text-red-400"
                title="Event hinzufügen"
              >
                <CalendarPlus className="h-3 w-3" />
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Push Notification Button (replacing Event Share Button) */}
            <Button
              onClick={handleEnablePushNotifications}
              variant="outline"
              size="icon"
              type="button"
              className="rounded-full h-6 w-6"
              style={colors.borderStyle}
              title="Push-Benachrichtigungen aktivieren"
            >
              <Bell className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-6 px-2 text-[10px] flex items-center gap-1 min-w-[70px]"
                  style={{...colors.borderStyle, ...colors.textStyle}}
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
          </>
        )}
      </div>
      
      <div 
        className={cn(
          "absolute inset-0 cursor-text z-5 pointer-events-none",
          getButtonWidth().replace('pl-', 'left-')
        )}
        onClick={handleSuggestionClick}
        style={{ pointerEvents: localInput.trim() === '' && displayText.trim() !== '' ? 'auto' : 'none' }}
      />
      
      <Textarea
        ref={textareaRef} // Assign the ref here
        value={localInput}
        onChange={handleLocalInputChange}
        onKeyDown={handleLocalKeyPress}
        placeholder={placeholderText}
        rows={1} // Start with 1 row
          className={cn(
            "w-full bg-background/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border rounded-xl py-2 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground pr-20 transition-all duration-200 text-left min-h-[40px] overflow-hidden",
            getButtonWidth()
          )}
          style={activeChatModeValue === 'community' ? {
            ...colors.borderStyle,
            ...colors.shadowStyle,
            '--placeholder-color': colors.primary
          } as React.CSSProperties & { '--placeholder-color': string } : {
            borderColor: 'hsl(var(--border))',
            '--placeholder-color': 'hsl(var(--muted-foreground))'
          } as React.CSSProperties & { '--placeholder-color': string }}
      />

      {showTagSuggestions && (
        <div className="absolute bottom-12 left-2 z-50 w-56 rounded-md border bg-popover shadow-md">
          {filteredTags.map((t, i) => (
            <button
              key={t.value}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent",
                i === activeTagIndex ? "bg-accent" : undefined
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                applyTag(t.value);
              }}
            >
              <span style={getChannelColor(t.value).textStyle}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="absolute right-10 top-1/2 -translate-y-1/2">
        <EmojiPicker
          onEmojiSelect={(emoji) => insertAtCursor(emoji)}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              type="button"
              aria-label="Emoji hinzufügen"
            >
              <span className="text-lg leading-none">😊</span>
            </Button>
          }
        />
      </div>

      <button
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
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0 flex-shrink-0 h-8 w-8 flex items-center justify-center text-white"
          style={localInput.trim() && !isTyping
            ? (activeChatModeValue === 'community' ? colors.bgStyle : { backgroundColor: 'hsl(var(--primary))' })
            : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
          }
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatInput;