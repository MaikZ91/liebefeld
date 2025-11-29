import React, { useState, useRef, useEffect } from 'react';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { ChatMessage, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { ArrowUp, X } from 'lucide-react';
import { personalizationService } from '@/services/personalizationService';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

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
             <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                 <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
             </div>
             <div>
                 <h2 className="font-bold text-sm uppercase tracking-widest">MIA</h2>
                 <p className="text-[10px] text-zinc-500 uppercase">Always Active</p>
             </div>
         </div>
         <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/20 mt-1">
                <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
              </div>
            )}
            <div className={`flex-1 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'text-white font-medium text-right' : 'text-zinc-400 text-left'}`}>
                  {msg.text}
              </div>
              {msg.relatedEvents && (
                <div className="mt-6 w-full md:w-[80%] space-y-4">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1 h-1 rounded-full bg-gold animate-pulse" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      MIA Match Score zeigt, wie gut Events zu deinen Vorlieben passen
                    </span>
                  </div>
                  {msg.relatedEvents.map((evt, eIdx) => {
                    const matchScore = personalizationService.calculateMatchScore(evt);
                    return <TribeEventCard key={eIdx} event={evt} variant="standard" matchScore={matchScore} />;
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
              <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
            </div>
            <div className="text-xs text-zinc-600 uppercase tracking-widest animate-pulse">Thinking...</div>
          </div>
        )}
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
