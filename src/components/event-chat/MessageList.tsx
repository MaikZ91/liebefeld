
import React from 'react';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageListProps } from './types';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  handleDateSelect,
  messagesEndRef,
  examplePrompts,
  handleExamplePromptClick
}) => {
  const renderMessages = () => {
    return messages.map((message) => (
      <div
        key={message.id}
        className={cn(
          "max-w-[85%] rounded-lg",
          message.isUser
            ? "bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 ml-auto"
            : "bg-zinc-900/50 dark:bg-zinc-800/50 border border-zinc-700/30"
        )}
      >
        {message.html ? (
          <div 
            dangerouslySetInnerHTML={{ __html: message.html }} 
            className="p-3 event-list-container"
          />
        ) : (
          <ChatMessage 
            message={message.text} 
            isGroup={false} 
            onDateSelect={handleDateSelect}
            showDateSelector={message.isUser && message.text.toLowerCase().includes('event')}
          />
        )}
      </div>
    ));
  };

  return (
    <ScrollArea className="h-full">
      {/* Add style tag properly for TypeScript */}
      <style>
        {`
        .event-list-container ul li {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          margin-bottom: 0.5rem !important;
        }
        
        .event-list-container ul li::before {
          content: "•";
          display: inline-block;
          margin-right: 0.5rem;
          color: #ff5252;
          font-size: 1.25rem;
          line-height: 1.5rem;
        }
        
        .event-list-container ul {
          list-style-type: none !important;
          padding-left: 0.5rem !important;
        }
        
        .event-list-container ul li span {
          display: inline-block !important;
        }
        
        .event-list-container ul li .event-title {
          font-weight: 600 !important;
          display: block !important;
          margin-bottom: 0.25rem !important;
        }
        `}
      </style>
      
      <div className="space-y-3 pb-2">
        {renderMessages()}
        
        {isTyping && (
          <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
            <div className="flex space-x-2 items-center">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        {/* Display example prompts only if there's just the welcome message */}
        {messages.length === 1 && messages[0].id === 'welcome' && (
          <div className="bg-zinc-900/50 dark:bg-zinc-800/50 max-w-[85%] rounded-lg p-3 border border-zinc-700/30 mt-4">
            <p className="text-sm text-red-200 mb-2">
              Frag mich zum Beispiel:
            </p>
            <div className="flex flex-col gap-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start bg-red-900/20 hover:bg-red-900/30 text-red-200 border-red-500/30"
                  onClick={() => handleExamplePromptClick(prompt)}
                >
                  "{prompt}"
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
