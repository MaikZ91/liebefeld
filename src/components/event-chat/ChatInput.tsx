// src/components/event-chat/ChatInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart, History, CalendarPlus, Send, Bell } from 'lucide-react';
import { ChatInputProps } from './types';
import { usePerfectDaySubscription } from '@/hooks/chat/usePerfectDaySubscription';

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
  showAnimatedPrompts // Empfangen der Prop
}) => {
  // Get username from localStorage for subscription
  const username = typeof window !== 'undefined' 
    ? localStorage.getItem('community_chat_username') || 'Anonymous'
    : 'Anonymous';

  const { isSubscribed, loading, toggleSubscription } = usePerfectDaySubscription(username);

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

  const placeholderText = showAnimatedPrompts && input.trim() === '' ? displayText : "Schreibe eine Nachricht..."; 

  return (
    <div className="flex items-center relative max-w-full">
      <div className="absolute left-2 flex items-center gap-1 z-10">
        {/* Heart button for toggling personalized mode */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleHeartClick} 
          className={`h-6 w-6 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`} 
          title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
        >
          <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-red-500' : ''}`} />
        </Button>
        
        {/* History button for recent queries */}
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

        {/* Perfect Day subscription bell */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSubscription}
          disabled={loading}
          className={`h-6 w-6 ${isSubscribed ? 'text-yellow-500' : 'text-red-400'}`}
          title={isSubscribed ? "Perfect Day Nachrichten abbestellen" : "Tägliche Perfect Day Nachrichten abonnieren"}
        >
          <Bell className={`h-3 w-3 ${isSubscribed ? 'fill-yellow-500' : ''} ${loading ? 'animate-pulse' : ''}`} />
        </Button>

        {/* Add Event button with calendar icon */}
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
      </div>
      
      <input 
        ref={inputRef} 
        type="text" 
        value={input} 
        onChange={handleInputChange} 
        onKeyPress={handleKeyPress} 
        placeholder={placeholderText}
        className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border-2 border-red-500 rounded-full py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-red-200 placeholder-red-500 pl-32 pr-14 shadow-md shadow-red-500/10 transition-all duration-200 hover:border-red-600 min-w-0" 
      />
      
      {/* Clickable overlay for placeholder suggestions */}
      {showAnimatedPrompts && input.trim() === '' && displayText.trim() !== '' && ( 
        <div 
          className="absolute left-32 right-14 top-3 bottom-3 cursor-pointer z-5"
          onClick={handleSuggestionClick}
          title="Klicken um Vorschlag zu übernehmen"
        />
      )}
      
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