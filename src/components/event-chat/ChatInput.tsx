// File: src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, History, CalendarPlus, Send, Calendar, ChevronDown } from 'lucide-react';
import { ChatInputProps } from './types';
import { useEventContext } from '@/contexts/EventContext';

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
}

const ChatInput: React.FC<ExtendedChatInputProps> = ({
  input, // This is the value from the parent hook (useChatLogic or useMessageSending)
  setInput, // This is the setter for the parent hook's input
  handleSendMessage,
  isTyping, // This is AI's processing status OR community sending status
  onKeyDown, // Renamed from handleKeyPress, now directly from props
  onChange, // Renamed from parentHandleInputChange, now directly from props
  isHeartActive,
  handleHeartClick,
  globalQueries,
  toggleRecentQueries,
  inputRef,
  onAddEvent,
  showAnimatedPrompts,
  activeChatModeValue,
  activeCategory = 'Ausgehen',
  onCategoryChange
}) => {
  const { events } = useEventContext();
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  // NEW: Local state for the input field value
  const [localInput, setLocalInput] = useState(input);

  // Sync localInput with parent input prop if it changes (e.g., from example prompts)
  useEffect(() => {
    setLocalInput(input);
  }, [input]);


  const suggestions = [
    "Frage nach Events...",
    "Welche Events gibt es heute?",
    "Was kann ich am Wochenende machen?",
    "Gibt es Konzerte im Lokschuppen?",
    "❤️ Zeige mir Events, die zu mir passen"
  ];

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!showAnimatedPrompts) {
      setDisplayText('');
      return;
    }

    if (localInput.trim() !== '') { // Use localInput here
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
  }, [displayText, isDeleting, currentSuggestionIndex, localInput, suggestions, showAnimatedPrompts]); // Use localInput


  // NEW: Local handler for input change
  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInput(e.target.value); // Update local state immediately
    // If there's an onChange prop provided, call it
    if (onChange) {
      onChange(e); // Propagate to parent if in community mode
    }
  };

  // NEW: Local handler for sending message
  const handleLocalSendMessage = (eventData?: any) => {
    setInput(localInput); // Update parent hook's input state right before sending
    handleSendMessage(localInput); // Pass localInput to handleSendMessage
    setLocalInput(''); // Clear local input field
  };
  
  // NEW: Local handler for key press (specifically for Enter)
  const handleLocalKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLocalSendMessage();
    } else {
      // If parent has a keyPress handler (e.g. for debug or other purposes), call it
      if (onKeyDown) {
        onKeyDown(e);
      }
    }
  };


  const handleSuggestionClick = () => {
    if (localInput.trim() === '' && displayText.trim() !== '') { // Use localInput
      setLocalInput(displayText); // Set local input from suggestion
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const getDynamicPlaceholder = () => {
    if (activeChatModeValue === 'ai') {
      return showAnimatedPrompts && localInput.trim() === '' ? displayText : "Frage nach Events..."; // Use localInput
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
                // Pass event data to handleSendMessage for sharing
                handleSendMessage({
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

  // Calculate dynamic padding based on buttons
  const getButtonWidth = () => {
    if (activeChatModeValue === 'community') {
      return 'pl-[120px]'; // Calendar + Category buttons
    } else {
      // AI mode: Heart + History (if available) + Add Event
      const baseButtons = 2; // Heart + Add Event
      const historyButton = globalQueries.length > 0 ? 1 : 0;
      const totalButtons = baseButtons + historyButton;
      return totalButtons === 2 ? 'pl-14' : 'pl-20';
    }
  };

  return (
    <div className="flex items-center relative w-full max-w-md">
      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 z-10">
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
        style={{ pointerEvents: localInput.trim() === '' && displayText.trim() !== '' ? 'auto' : 'none' }} // Use localInput
      />
      
      <input
        ref={inputRef}
        type="text"
        value={localInput} // Use localInput here
        onChange={handleLocalInputChange} // Use local handler
        onKeyPress={handleLocalKeyPress} // Use local handler
        placeholder={placeholderText}
        className={cn(
          "w-full bg-zinc-900/50 dark:bg-zinc-800/50 border-2 border-red-500 rounded-full py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-red-200 placeholder-red-500 pr-10 shadow-md shadow-red-500/10 transition-all duration-200 hover:border-red-600 text-left",
          getButtonWidth()
        )}
      />

      <button
        onClick={() => handleLocalSendMessage()} // Call local send handler without event
        disabled={!localInput.trim() || isTyping} // Use localInput for validation
        className={cn(
          "absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full p-1.5 flex-shrink-0",
          localInput.trim() && !isTyping // Use localInput for visual state
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