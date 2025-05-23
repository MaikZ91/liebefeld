
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart, History, CalendarPlus, Send, Users, MessageSquare } from 'lucide-react';
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
  onAddEvent,
  activeChatMode,
  onToggleChatMode
}) => {
  return (
    <div className="flex items-center relative">
      <div className="absolute left-2 flex items-center gap-1 z-10">
        {/* Toggle button for AI/Community chat */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleChatMode} 
          className={`h-6 w-6 ${activeChatMode === 'community' ? 'text-red-500' : 'text-red-400'}`} 
          title={activeChatMode === 'community' ? "Community Chat aktiv" : "AI Chat aktiv"}
        >
          {activeChatMode === 'community' ? (
            <Users className="h-3 w-3 fill-red-500" />
          ) : (
            <MessageSquare className="h-3 w-3" />
          )}
        </Button>

        {/* Heart button for toggling personalized mode - only in AI mode */}
        {activeChatMode === 'ai' && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleHeartClick} 
            className={`h-6 w-6 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`} 
            title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}
          >
            <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-red-500' : ''}`} />
          </Button>
        )}
        
        {/* History button for recent queries - only in AI mode */}
        {activeChatMode === 'ai' && globalQueries.length > 0 && (
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

        {/* Add Event button with calendar icon - only in AI mode */}
        {activeChatMode === 'ai' && onAddEvent && (
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
        placeholder={activeChatMode === 'community' ? "Schreibe in der Community..." : "Frage nach Events..."} 
        className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border-2 border-red-500 rounded-full py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-red-200 placeholder-red-500 pl-28 pr-10 shadow-md shadow-red-500/10 transition-all duration-200 hover:border-red-600" 
      />
      
      <button 
        onClick={() => handleSendMessage()} 
        disabled={!input.trim() || isTyping} 
        className={cn(
          "absolute right-1 rounded-full p-2", 
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
