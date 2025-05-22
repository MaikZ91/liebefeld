
import React, { useEffect, useRef } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import parse from 'html-react-parser';
import "./MessageList.css";

interface MessageListProps {
  messages: { id: string; content: string; type: 'user' | 'bot' }[];
  isTyping: boolean;
  handleDateSelect?: (date: string) => void;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  examplePrompts?: string[];
  handleExamplePromptClick?: (prompt: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  handleDateSelect,
  messagesEndRef,
  examplePrompts,
  handleExamplePromptClick
}) => {
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  // Detect dates in the message content
  const detectDates = (content: string) => {
    const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/g;
    const hasDate = dateRegex.test(content);
    if (hasDate && handleDateSelect) {
      return content.replace(dateRegex, (match) => {
        return `<span class="date-link" data-date="${match}">${match}</span>`;
      });
    }
    return content;
  };

  // Handle click on a date in the message
  const handleDateClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target instanceof HTMLElement && 
      e.target.classList.contains('date-link') && 
      e.target.dataset.date && 
      handleDateSelect
    ) {
      handleDateSelect(e.target.dataset.date);
    }
  };

  // Sanitize HTML content including links
  const sanitizeContent = (content: string) => {
    try {
      // Ensure pure HTML content is recognized
      if (content.startsWith('<div') || content.startsWith('<h')) {
        return content;
      }
      
      // Process markdown-style links
      content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-red-500 hover:text-red-600 underline">$1</a>');
      
      // Process explicit HTML links
      content = content.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" class="text-red-500 hover:text-red-600 underline" ');
      
      // Process dates for clickability
      content = detectDates(content);
      
      return content;
    } catch (error) {
      console.error('Error sanitizing content:', error);
      return content;
    }
  };

  // If there are no messages, display the welcome message or example prompts
  if (messages.length === 0) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        <div 
          className="bot-message"
          onClick={handleDateClick}
        >
          {parse(sanitizeContent(`
            <div class="rounded-lg p-3 text-sm">
              <h2 class="text-2xl font-bold text-red-500 mb-2">Hallo Liebefeld!</h2>
              <p>
                Ich bin dein persönlicher Event-Assistent für Liebefeld. 
                Ich helfe dir, die besten Veranstaltungen in deiner Nähe zu finden.
                Für persönliche Empfehlungen erstelle dir dein Profil in der Community.
              </p>
              <p class="mt-2">
                Aktuelles Datum: <strong>${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
              </p>
            </div>
          `))}
        </div>
        
        {examplePrompts && examplePrompts.length > 0 && (
          <div className="example-prompts mt-4">
            <h4 className="text-sm font-medium mb-2 text-red-400">Beispiele:</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExamplePromptClick && handleExamplePromptClick(prompt)}
                  className="px-3 py-1 bg-red-900/30 hover:bg-red-900/40 border border-red-500/20 rounded-full text-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef}></div>
      </div>
    );
  }

  // Render the actual message list
  return (
    <div className="flex flex-col space-y-2 pb-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          onClick={message.type === 'bot' ? handleDateClick : undefined}
        >
          {message.type === 'bot' 
            ? parse(sanitizeContent(message.content)) 
            : message.content}
        </div>
      ))}
      
      {isTyping && (
        <div className="bot-message">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef}></div>
    </div>
  );
};

export default MessageList;
