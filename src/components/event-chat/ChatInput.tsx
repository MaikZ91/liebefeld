// src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart, History, CalendarPlus, Send, Paperclip, Calendar } from 'lucide-react'; // Paperclip und Calendar importieren
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
  activeChatModeValue // <-- Diese Prop ist entscheidend!
}) => {
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
  // AI-Modus: Hat 3 Icon-Buttons. Jeder Icon-Button ist h-6 w-6 (24px).
  //  Breite (icons) = 3 * 24px + 2 * 4px (gap) = 72 + 8 = 80px. Also pl-20 ist gut.
  // Community-Modus: Hat 2 Icon-Buttons (24px) und 3 Text-Buttons (ca. 70px breit, da px-2).
  //  Angenommen, Icons sind links, Text-Buttons rechts davon.
  //  Breite (icons) + Abstand + Breite (text-buttons)
  //  (2 * 24px + 1 * 4px (gap)) + (3 * 70px + 2 * 4px (gap)) = (48 + 4) + (210 + 8) = 52 + 218 = 270px
  // Das ist zu viel für das aktuelle Layout. Stattdessen werden die Icon-Buttons und die Text-Buttons
  // in zwei getrennten, vertikal gestapelten Blöcken direkt links vom Input platziert.
  // Block 1 (Icon-Buttons): ca. 24px breit.
  // Block 2 (Text-Buttons): ca. 70px breit.
  // Die Textarea muss den breitesten Block plus linken Puffer abdecken.
  // Da die Text-Buttons breiter sind, müssen wir das Padding nach deren Breite ausrichten.
  // (Breite Text-Button) + (links-Puffer des Inputs) = 70px + 16px (standard input padding) = 86px
  // Plus den Abstand zwischen den Button-Spalten. Sagen wir 90px für den Start des Textes.
  // Um etwas Puffer zu haben und sicherzustellen, dass die Textbuttons nicht zu eng sind,
  // setze ich das padding auf 110px.
  const inputPaddingLeft = activeChatModeValue === 'community' ? 'pl-[110px]' : 'pl-20';


  return (
    <div className="flex items-center relative max-w-full">
      <div className="absolute left-2 top-1 flex flex-col gap-1 z-10"> {/* Angepasste Positionierung für vertikalen Stack */}
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
            {/* Icon-Buttons (Event teilen & Bild anhängen) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  // onClick={handleShareEvent} // Deaktiviert, da Popover das übernimmt
                  variant="outline"
                  size="icon"
                  type="button"
                  className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10"
                  title="Event teilen"
                >
                  <Calendar className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              {/* PopoverContent für Event teilen (wie in MessageInput.tsx) */}
              {/* Hier sollte die Logik für eventSelectContent rein, oder diese Popover-Struktur muss überlegt werden */}
              {/* Da ChatInput diese Props nicht direkt kennt, muss handleShareEvent hier die Popover steuern */}
              {/* Da wir hier nur die Trigger anzeigen, ist das Popover-Handling außerhalb dieser Komponente. */}
              {/* Für den Moment ist es ok, da wir den EventSelectContent nicht direkt im ChatInput handhaben. */}
              {/* Das PopoverContent würde hier nicht direkt passen, da es den Status (isEventSelectOpen) von GroupChat oder MessageInput benötigt. */}
              {/* Ich werde es vereinfachen und das PopoverContent hier nicht direkt rendern, da es an anderer Stelle gerendert wird. */}
              <PopoverContent className="w-80 p-0 max-h-[400px] overflow-y-auto" side="top" align="start" sideOffset={5}>
                 {/* Da ChatInput.tsx dies nicht direkt kennt, wird es hier weggelassen,
                 es wird erwartet, dass dies von der aufrufenden Komponente gehandhabt wird. */}
                 {/* Beispiel: Ein Klick auf den Button würde eine Funktion in FullPageChatBot auslösen,
                 die dann das Popover rendert. */}
                 <div className="p-4 text-sm text-gray-400">Eventauswahl wird geladen...</div>
              </PopoverContent>
            </Popover>

            <Button
              // onClick={handleFileUpload} // Deaktiviert, da handleFileUpload nicht hier ist
              variant="outline"
              size="icon"
              type="button"
              className="rounded-full h-6 w-6 border-red-500/30 hover:bg-red-500/10"
              title="Bild anhängen"
            >
              <Paperclip className="h-3 w-3" />
            </Button>
            {/* Kategorie-Buttons - direkt neben den Icon-Buttons */}
            <div className="flex flex-col gap-1 absolute left-[32px] top-0"> {/* Startet nach dem ersten Icon-Button (24px) + etwas Abstand (8px) */}
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
            </div>
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
      
      <input // Hier wurde Textarea durch input ersetzt, da das Beispiel ein input-Feld zeigt.
        ref={inputRef}
        type="text" // Type text, da es ein einfaches Eingabefeld ist
        value={input}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholderText}
        className={cn(
          "flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border-2 border-red-500 rounded-full py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-red-200 placeholder-red-500 pr-14 shadow-md shadow-red-500/10 transition-all duration-200 hover:border-red-600 min-w-0 text-left",
          inputPaddingLeft // Dynamisches padding-left
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