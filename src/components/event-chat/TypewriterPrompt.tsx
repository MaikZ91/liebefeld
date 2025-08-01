
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface TypewriterPromptProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  loopInterval?: number; // ms between prompt changes
  typingSpeed?: number; // ms per character
}

const TypewriterPrompt: React.FC<TypewriterPromptProps> = ({
  prompts,
  onPromptClick,
  loopInterval = 2500,
  typingSpeed = 80,
}) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const loopTimeout = useRef<NodeJS.Timeout | null>(null);
  const cursorTimeout = useRef<NodeJS.Timeout | null>(null);

  // Start typing effect when prompt changes
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setShowCursor(true);
    
    let i = 0;
    const typeChar = () => {
      if (i < prompts[currentPromptIndex].length) {
        setDisplayedText(prev => prev + prompts[currentPromptIndex][i]);
        i++;
        typingTimeout.current = setTimeout(typeChar, typingSpeed);
      } else {
        setIsTyping(false);
        // Cursor blinkt weiter nach dem Tippen
        cursorTimeout.current = setTimeout(() => {
          loopTimeout.current = setTimeout(() => {
            setCurrentPromptIndex((idx) => (idx + 1) % prompts.length);
          }, loopInterval - 1000);
        }, 1000);
      }
    };
    
    typeChar();
    
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (loopTimeout.current) clearTimeout(loopTimeout.current);
      if (cursorTimeout.current) clearTimeout(cursorTimeout.current);
    };
  }, [currentPromptIndex, prompts, typingSpeed, loopInterval]);

  const handlePromptClick = () => {
    onPromptClick(prompts[currentPromptIndex]);
  };

  return (
    <div className="flex flex-col items-center py-3 animate-fade-in">
      <Button
        variant="outline"
        className="border-2 border-red-500 bg-black text-red-400 hover:bg-red-900/60 shadow hover:scale-105 transition-all duration-300 p-4 px-6 text-base font-medium flex items-center gap-3 rounded-xl max-w-[90vw] w-full md:max-w-md"
        onClick={handlePromptClick}
        aria-label={`Prompt: ${displayedText}`}
      >
        <MessageSquare className="w-5 h-5 shrink-0 text-red-400" />
        <div className="flex-1 min-w-0 text-left">
          <div className="bg-gray-900/50 border border-red-500/30 rounded-lg px-3 py-2 text-sm font-mono relative overflow-hidden">
            <span className="text-gray-300 opacity-70 text-xs">Frage eingeben...</span>
            <div className="mt-1 min-h-[1.2em] relative">
              <span className="text-red-300 break-words leading-relaxed">
                {displayedText}
              </span>
              <span 
                className={`inline-block w-0.5 h-4 bg-red-400 ml-0.5 align-text-bottom transition-opacity duration-300 ${
                  showCursor ? 'animate-pulse opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </div>
        </div>
      </Button>
    </div>
  );
};

export default TypewriterPrompt;
