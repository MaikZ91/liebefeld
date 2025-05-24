
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { History, CalendarPlus, Send, User } from 'lucide-react';
import { ChatInputProps } from './types';

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
    <div className="flex items-center relative max-w-full">
      <div className="absolute left-2 flex items-center gap-1 z-10">
        {/* User profile button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleHeartClick} 
          className="h-6 w-6 text-red-400 hover:text-red-500" 
          title="Benutzerprofil bearbeiten"
        >
          <User className="h-3 w-3" />
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
        onChange={e => setInput(e.target.value)} 
        onKeyPress={handleKeyPress} 
        placeholder="Frage nach Events..." 
        className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border-2 border-red-500 rounded-full py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-red-200 placeholder-red-500 pl-24 pr-14 shadow-md shadow-red-500/10 transition-all duration-200 hover:border-red-600 min-w-0" 
      />
      
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
