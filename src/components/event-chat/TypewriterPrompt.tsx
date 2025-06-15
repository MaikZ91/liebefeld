
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
  typingSpeed = 60,
}) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const loopTimeout = useRef<NodeJS.Timeout | null>(null);

  // Start typing effect when prompt changes
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const typeChar = () => {
      if (i < prompts[currentPromptIndex].length) {
        setDisplayedText(prev => prev + prompts[currentPromptIndex][i]);
        i++;
        typingTimeout.current = setTimeout(typeChar, typingSpeed);
      } else {
        setIsTyping(false);
        loopTimeout.current = setTimeout(() => {
          setCurrentPromptIndex((idx) => (idx + 1) % prompts.length);
        }, loopInterval);
      }
    };
    typeChar();
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (loopTimeout.current) clearTimeout(loopTimeout.current);
    };
    // eslint-disable-next-line
  }, [currentPromptIndex, prompts, typingSpeed, loopInterval]);

  const handlePromptClick = () => {
    onPromptClick(prompts[currentPromptIndex]);
  };

  return (
    <div className="flex flex-col items-center py-2 animate-fade-in">
      <Button
        variant="outline"
        className="border-2 border-red-500 bg-black text-red-400 hover:bg-red-900/60 shadow hover:scale-105 transition p-4 px-6 text-lg font-semibold flex items-center gap-2 rounded-xl"
        onClick={handlePromptClick}
        aria-label={`Prompt: ${displayedText}`}
      >
        <MessageSquare className="w-5 h-5 shrink-0" />
        <span className="font-mono typewriter min-w-[150px]" aria-live="off">
          {displayedText}
          <span className="animate-pulse">|</span>
        </span>
      </Button>
      <style>{`
        .typewriter {
          letter-spacing: 0.01em;
          white-space: pre;
        }
      `}</style>
    </div>
  );
};

export default TypewriterPrompt;

