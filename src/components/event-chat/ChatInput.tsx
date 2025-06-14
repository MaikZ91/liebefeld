import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, History, CalendarPlus, Send, Calendar, ChevronDown } from 'lucide-react';
import { ChatInputProps } from './types';
import { useEventContext } from '@/contexts/EventContext';

// Add a separate AnimatedText component if it's not already defined elsewhere
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
  input,
  setInput,
  handleSendMessage,
  isTyping,
  handleKeyPress,
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
  const { events } = useEventContext(); // Zugriff auf Events
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);

  // Animated placeholder suggestions
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
    // Wenn die Animation nicht gezeigt werden soll, displayText zurücksetzen und abbrechen.
    if (!showAnimatedPrompts) {
      setDisplayText('');
      return;
    }

    // Nur animieren, wenn das Inputfeld leer ist.
    if (input.trim() !== '') {
      setDisplayText(''); // Wichtig: Wenn Input vorhanden, Animation stoppen
      return;
    }

    const currentSuggestion = suggestions[currentSuggestionIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing animation
        if (displayText.length < currentSuggestion.length) {
          setDisplayText(currentSuggestion.slice(0, displayText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting animation
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Move to next suggestion
          setIsDeleting(false);
          setCurrentSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentSuggestionIndex, input, suggestions, showAnimatedPrompts]);

  // Handle input change - always expect setInput to accept string
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Handle suggestion click
  const handleSuggestionClick = () => {
    if (input.trim() === '' && displayText.trim() !== '') {
      const currentSuggestion = suggestions[currentSuggestionIndex];
      setInput(currentSuggestion);
      // Focus the input after setting the value
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Dynamischer Placeholder-Text basierend auf dem aktiven Chat-Modus
  const getDynamicPlaceholder = () => {
    if (activeChatModeValue === 'ai') {
      return showAnimatedPrompts && input.trim() === '' ? displayText : "Frage nach Events...";
    } else { // 'community'
      return "Verbinde dich mit der Community...";
    }
  };

  const placeholderText = getDynamicPlaceholder();

  // Event-Inhalt für das Popover
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
                setInput(`Hier ist ein Event: ${event.title} am ${event.date} um ${event.time} in ${event.location}`);
                setIsEventSelectOpen(false);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
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

  // Enhanced category click handler with state management
  const handleCategoryClick = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    setInput(`Zeige mir Events in der Kategorie: ${category}`);
    // Optional: Direkt senden oder Fokus setzen
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, 0);
  };

  // Bestimme das padding-left basierend auf dem aktiven Modus
  const inputPaddingLeft = activeChatModeValue === 'community' ? 'pl-[140px]' : 'pl-28';

  return (
    <div className="flex items-center relative max-w-full">
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-10">
        {activeChatModeValue === 'ai' ? (
          <>
            {/* Herz button für personalisierten Modus */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHeartClick}
              className={`h-6 w-6 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`}
              title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
            >
              <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-red-500' : ''}`} />
            </Button>

            {/* History button für Community Anfragen */}
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

            {/* Add Event button mit Kalender-Icon */}
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
        ) : ( // Community Chat Buttons
          <>
            {/* Kategorie-Dropdown (jetzt zuerst) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10 flex items-center gap-1 min-w-[80px]"
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
            
            {/* Event teilen Button (jetzt zweiter) */}
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
          </>
        )}
      </div>
      
      {/* Clickable overlay for animated text */}
      <div 
        className={cn(
          "absolute inset-0 cursor-text z-5 pointer-events-none",
          activeChatModeValue === 'community' ? 'left-[140px]' : 'left-28'
        )}
        onClick={handleSuggestionClick}
        style={{ pointerEvents: input.trim() === '' && displayText.trim() !== '' ? 'auto' : 'none' }}
      />
      
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholderText}
        className={cn(
          "flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border-2 border-red-500 rounded-full py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-red-200 placeholder-red-500 pr-14 shadow-md shadow-red-500/10 transition-all duration-200 hover:border-red-600 min-w-0 text-left",
          inputPaddingLeft
        )}
      />

      {/* Send button on the right */}
      <button
        onClick={() => handleSendMessage()}
        disabled={!input.trim() || isTyping}
        className={cn(
          "absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2 flex-shrink-0",
          input.trim() && !isTyping
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-zinc-800 text-zinc-500"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatInput;
