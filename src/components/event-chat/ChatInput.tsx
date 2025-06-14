
// src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, History, CalendarPlus, Send, Paperclip, Calendar } from 'lucide-react';
import { ChatInputProps } from './types';

// Add a separate AnimatedText component if it's not already defined elsewhere
const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <span key={text} className={cn("inline-block whitespace-nowrap overflow-hidden animate-typing", className)}>
      {text}
    </span>
  );
};

const ChatInput: React.FC<ChatInputProps> = ({
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
  activeChatModeValue
}) => {
  // Add fileInputRef declaration
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Funktion für Kategorie-Buttons (muss in dieser Komponente definiert werden)
  const handleCategoryClick = (category: string) => {
    setInput(`Zeige mir Events in der Kategorie: ${category}`);
    // Optional: Direkt senden oder Fokus setzen
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, 0);
  };

  // Bestimme das padding-left basierend auf dem aktiven Modus
  // AI-Modus: Hat 3 Icon-Buttons horizontal angeordnet. Jeder Icon-Button ist h-6 w-6 (24px).
  //  Breite (icons) = 3 * 24px + 2 * 4px (gap) = 72 + 8 = 80px. Also pl-20 ist gut.
  // Community-Modus: Hat 2 Icon-Buttons und 3 Text-Buttons horizontal angeordnet.
  //  Geschätzte Gesamtbreite: (2 * 24px) + (3 * 70px) + Abstände = 48 + 210 + 20 = 278px
  //  Das ist zu viel, daher nutzen wir eine kompaktere Anordnung mit weniger padding
  const inputPaddingLeft = activeChatModeValue === 'community' ? 'pl-[280px]' : 'pl-20';

  return (
    <div className="flex items-center relative max-w-full">
      <div className="absolute left-2 top-1 flex items-center gap-1 z-10">
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
            {/* Icon-Buttons (Event teilen & Bild anhängen) - horizontal angeordnet */}
            <Popover>
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
                <div className="p-4 text-sm text-gray-400">Eventauswahl wird geladen...</div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              type="button"
              className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10"
              title="Bild anhängen"
            >
              <Paperclip className="h-3 w-3" />
            </Button>
            
            {/* Kategorie-Buttons - horizontal neben den Icon-Buttons */}
            <Button
              onClick={() => handleCategoryClick('Kreativität')}
              variant="outline"
              size="sm"
              className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10"
            >
              Kreativität
            </Button>
            <Button
              onClick={() => handleCategoryClick('Ausgehen')}
              variant="outline"
              size="sm"
              className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10"
            >
              Ausgehen
            </Button>
            <Button
              onClick={() => handleCategoryClick('Sport')}
              variant="outline"
              size="sm"
              className="rounded-full h-6 px-2 text-[10px] border-red-500/30 hover:bg-red-500/10"
            >
              Sport
            </Button>
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={() => {}}
      />
      
      {/* Clickable overlay for animated text */}
      <div 
        className={cn(
          "absolute inset-0 cursor-text z-5 pointer-events-none",
          activeChatModeValue === 'community' ? 'left-[280px]' : 'left-20'
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
          "absolute right-2 rounded-full p-2 flex-shrink-0",
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
