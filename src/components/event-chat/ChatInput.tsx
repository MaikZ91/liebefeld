// src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, History, CalendarPlus, Send, Calendar, ChevronDown } from 'lucide-react';
import { ChatInputProps } from './types';
import { useEventContext } from '@/contexts/EventContext';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

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
    if (!localInput.trim() && !eventData) return; // Prevent empty sends
    
    if (activeChatModeValue === 'community') {
      // For community mode, just update the external input and let the parent handle sending
      setInput(localInput);
      return;
    }
    
    // For AI mode, handle sending directly
    setInput(localInput);
    await handleSendMessage(eventData || localInput);
    setLocalInput('');
  };
  
  const handleLocalKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeChatModeValue === 'community') {
        // For community mode, only update external input
        setInput(localInput);
        setLocalInput('');
      } else {
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
      return "Verbinde dich mit der Community...";
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
    <div className="flex items-end relative w-full max-w-md">
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
        {/* NEU: MIA Avatar */}
        <Avatar className="h-6 w-6 border-2 border-white/50">
          <AvatarImage src={miaAvatarUrl} />
        </Avatar>
        
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
            <Popover open={isEventSelectOpen} onOpenChange={setIsEventSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10"
                  title="Event teilen"
                >
                  <Calendar className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 max-h-[400px] overflow-y-auto" side="top" align="start" sideOffset={5}>
                {eventSelectContent}
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10 flex items-center gap-1 min-w-[70px]"
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
                    activeCategory === 'Kreativität' && "bg-red-500/20"
                  )}
                >
                  Kreativität
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
          "w-full bg-black border-2 border-gray-700/50 rounded-xl py-2 focus:outline-none text-sm text-white placeholder-white-400 pr-10 transition-all duration-200 hover:border-red-600 text-left min-h-[40px] overflow-hidden",
          getButtonWidth()
        )}
      />

      <button
        onClick={() => {
          if (activeChatModeValue === 'community') {
            // For community mode, only update external input
            setInput(localInput);
            setLocalInput('');
          } else {
            // For AI mode, use local send
            handleLocalSendMessage();
          }
        }}
        disabled={!localInput.trim() || isTyping}
        className={cn(
          "absolute right-1 bottom-1 rounded-full p-1.5 flex-shrink-0",
          localInput.trim() && !isTyping
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-zinc-800 text-zinc-500"
        )}
      >
        <Send className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ChatInput;