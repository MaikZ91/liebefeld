
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Heart, HistoryIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: string[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent?: () => void;
}

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
  onAddEvent
}) => {
  return (
    <div className="p-3 border-t border-red-500/20 relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isTyping ? "KI denkt nach..." : "Frage nach Events..."}
            disabled={isTyping}
            className="pr-20 border-red-500 focus:border-red-600 focus:ring-red-500"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Recent Queries Button */}
            <Button
              onClick={toggleRecentQueries}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-700"
              title="Letzte Anfragen anzeigen"
            >
              <HistoryIcon className="h-3 w-3" />
            </Button>
            
            {/* Heart Button */}
            <Button
              onClick={handleHeartClick}
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 transition-colors ${
                isHeartActive 
                  ? 'text-red-500 hover:text-red-400' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
              title={isHeartActive ? "Personalisierung deaktivieren" : "Personalisierung aktivieren"}
            >
              <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-current' : ''}`} />
            </Button>
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Add Event Button */}
      {onAddEvent && (
        <div className="mt-2">
          <Button
            onClick={onAddEvent}
            variant="outline"
            size="sm"
            className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            + Event hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
