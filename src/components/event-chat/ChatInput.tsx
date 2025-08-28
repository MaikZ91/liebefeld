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
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { getChannelColor } from '@/utils/channelColors';
import { useChatPreferences } from '@/contexts/ChatPreferencesContext';

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
      // Don't clear local input here - let parent handle clearing after successful send
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
        // Don't clear local input here - let parent handle clearing after successful send
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

  const { setActiveCategory } = useChatPreferences();
  
  const handleCategoryClick = (category: string) => {
    console.log('ChatInput: changing category to:', category);
    
    // Save to context (which persists to localStorage)
    setActiveCategory(category.toLowerCase());
    
    // Also call external handler if provided
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
      return 'pl-[90px]';
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
            "w-full bg-background/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border rounded-xl pt-4 pb-2 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground pr-10 transition-all duration-200 text-left min-h-[40px] overflow-hidden flex items-center",
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

      <button
        onClick={() => {
          console.log('Send button clicked in ChatInput', { activeChatModeValue, localInput });
          
          if (activeChatModeValue === 'community') {
            // For community mode, ONLY update external input - let parent handle sending
            console.log('Community mode: Send button - updating external input only');
            setInput(localInput);
            // Don't clear local input here - let parent handle clearing after successful send
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