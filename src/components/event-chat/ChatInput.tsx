
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Heart, Send, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import RecentQueries from './RecentQueries';
import TypewriterPrompt from './TypewriterPrompt';

interface ExtendedChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: any[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent?: () => void;
  showAnimatedPrompts: boolean;
  activeChatModeValue?: 'ai' | 'community';
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
  activeChatModeValue = 'ai',
  activeCategory,
  onCategoryChange
}) => {
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Alle', 'Konzert', 'Party', 'Ausstellung', 'Sport', 
    'Workshop', 'Kultur', 'Networking', 'Sonstiges'
  ];

  const animatedPrompts = [
    "Was ist heute los in der Stadt?",
    "Zeige mir Events für morgen",
    "Plane mir den perfekten Abend",
    "Was läuft dieses Wochenende?",
    "Empfiehl mir etwas Neues"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleRecentQueriesInternal = () => {
    setShowRecentQueries(!showRecentQueries);
    toggleRecentQueries();
  };

  const placeholderText = activeChatModeValue === 'community' 
    ? "Verbinde dich mit der Community..."
    : "Frage nach Events, Empfehlungen oder lass dir den perfekten Tag planen...";

  const handleCategorySelect = (category: string) => {
    const normalizedCategory = category === 'Alle' ? '' : category;
    onCategoryChange?.(normalizedCategory);
    setShowCategories(false);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="relative w-full">
      {showRecentQueries && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
          <RecentQueries 
            showRecentQueries={showRecentQueries}
            setShowRecentQueries={setShowRecentQueries}
            queriesToRender={globalQueries}
            handleExamplePromptClick={(query) => {
              setInput(query);
              setShowRecentQueries(false);
            }}
          />
        </div>
      )}

      {activeChatModeValue === 'ai' && showCategories && (
        <div 
          ref={categoriesRef}
          className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3"
        >
          <div className="grid grid-cols-3 gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => handleCategorySelect(category)}
                size="sm"
                variant="ghost"
                className={cn(
                  "text-xs h-8 justify-start transition-colors",
                  (activeCategory === category || (category === 'Alle' && !activeCategory))
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg p-2">
        <div className="flex items-center space-x-1">
          {activeChatModeValue === 'ai' && (
            <Button
              onClick={() => setShowCategories(!showCategories)}
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 transition-colors",
                showCategories || activeCategory
                  ? 'text-red-400 bg-red-500/20'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={handleHeartClick}
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 transition-colors",
              isHeartActive 
                ? 'text-red-500 animate-pulse' 
                : 'text-gray-400 hover:text-red-400'
            )}
          >
            <Heart className={cn("h-4 w-4", isHeartActive && "fill-current")} />
          </Button>

          {onAddEvent && (
            <Button
              onClick={onAddEvent}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-400 hover:text-green-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholderText}
            className="bg-transparent border-none text-white placeholder-gray-500 text-sm h-8 px-3 focus:ring-0 focus:border-none"
            disabled={isTyping}
          />
          
          {showAnimatedPrompts && input.length === 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <TypewriterPrompt 
                prompts={animatedPrompts}
                onPromptClick={handlePromptClick}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            onClick={toggleRecentQueriesInternal}
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Verlauf
          </Button>
          
          <Button
            onClick={handleSendMessage}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white transition-colors"
            disabled={isTyping || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
