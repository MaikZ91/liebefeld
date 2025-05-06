
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart, History, Send } from 'lucide-react';
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
  inputRef
}) => {
  return <div className="flex items-center relative">
      <div className="absolute left-2 flex items-center gap-1 z-10">
        {/* Heart button for toggling personalized mode */}
        <Button variant="ghost" size="icon" onClick={handleHeartClick} className={`h-6 w-6 ${isHeartActive ? 'text-red-500' : 'text-red-400'}`} title={isHeartActive ? "Personalisierter Modus aktiv" : "Standard-Modus aktiv"}>
          <Heart className={`h-3 w-3 ${isHeartActive ? 'fill-red-500' : ''}`} />
        </Button>
        
        {/* History button for recent queries */}
        {globalQueries.length > 0 && <Button variant="ghost" size="icon" onClick={toggleRecentQueries} className="h-6 w-6 text-red-400" title="Community Anfragen">
            <History className="h-3 w-3" />
          </Button>}
      </div>
      
      <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Frage nach Events..." className="flex-1 bg-zinc-900/50 dark:bg-zinc-800/50 border border-red-500/20 rounded-full py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs text-red-200 placeholder-red-200/50 pl-16 pr-10 px-[65px]" />
      <button onClick={() => handleSendMessage()} disabled={!input.trim() || isTyping} className={cn("absolute right-1 rounded-full p-2", input.trim() && !isTyping ? "bg-red-500 hover:bg-red-600 text-white" : "bg-zinc-800 text-zinc-500")}>
        <Send className="h-4 w-4" />
      </button>
    </div>;
};
export default ChatInput;
