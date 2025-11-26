import React, { useState, useRef, useEffect } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { ChatMessage, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { ArrowUp, X, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TribeAIChatProps {
  onClose: () => void;
  events: TribeEvent[];
}

export const TribeAIChat: React.FC<TribeAIChatProps> = ({ onClose, events }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    text: 'Hey! Ich bin dein persönlicher Event-Scout. Wonach suchst du heute?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await getTribeResponse(input, events);
    
    const botMsg: ChatMessage = {
      role: 'model',
      text: response.text,
      relatedEvents: response.relatedEvents
    };
    
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-gold" />
          <h2 className="text-white text-lg font-bold">TRIBE AI</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-gold text-black' : 'bg-zinc-900 text-white'} px-4 py-3 rounded-2xl`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {/* Related Events */}
                {msg.relatedEvents && msg.relatedEvents.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {msg.relatedEvents.map((event, i) => (
                      <TribeEventCard key={i} event={event} variant="compact" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 text-zinc-400 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-zinc-600 outline-none text-sm"
            placeholder="Ask for recommendations..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="text-gold disabled:text-zinc-700 hover:opacity-80 transition-opacity"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
