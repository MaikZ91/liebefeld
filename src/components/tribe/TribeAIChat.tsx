import React, { useState, useRef, useEffect } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { ChatMessage, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { ArrowUp, X, Sparkles } from 'lucide-react';

interface TribeAIChatProps {
  onClose: () => void;
  events: TribeEvent[];
  onQuery?: (query: string) => void;
}

export const TribeAIChat: React.FC<TribeAIChatProps> = ({ onClose, events, onQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Ready to curate your evening. What are you looking for?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);
    
    // Track query
    if (onQuery) onQuery(userText);
    
    const response = await getTribeResponse(userText, events);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: response.text, relatedEvents: response.relatedEvents }]);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white text-black rounded-sm flex items-center justify-center">
                 <Sparkles size={16} fill="black" />
             </div>
             <div>
                 <h2 className="font-bold text-sm uppercase tracking-widest">Concierge</h2>
                 <p className="text-[10px] text-zinc-500 uppercase">Always Active</p>
             </div>
         </div>
         <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'text-white font-medium text-right' : 'text-zinc-400 text-left'}`}>
                {msg.text}
            </div>
            {msg.relatedEvents && (
              <div className="mt-6 w-full md:w-[80%] space-y-4">
                {msg.relatedEvents.map((evt, eIdx) => <TribeEventCard key={eIdx} event={evt} variant="standard" />)}
              </div>
            )}
          </div>
        ))}
        {isTyping && <div className="text-xs text-zinc-600 uppercase tracking-widest pl-0 animate-pulse">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10 bg-black">
        <div className="flex items-center gap-4 border-b border-white/20 pb-2 focus-within:border-white transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent text-white placeholder-zinc-600 outline-none text-lg font-light"
              placeholder="Ask for a recommendation..."
            />
            <button onClick={handleSend} disabled={!input.trim()} className="text-white disabled:text-zinc-700 hover:opacity-80 transition-opacity">
                <ArrowUp size={24} />
            </button>
        </div>
      </div>
    </div>
  );
};
