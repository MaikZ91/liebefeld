// src/components/event-chat/MessageList.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessageListProps } from './types';
import './MessageList.css';
import { motion, AnimatePresence } from 'framer-motion';

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
            ? "bg-black border border-black ml-auto"
            : "bg-black border border-black"
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
    <div className="h-full overflow-y-auto">
      <div className="space-y-3 pb-2 px-1">
        {renderMessages()}
        
        <AnimatePresence>
          {isTyping && ( // Conditionally render the animated panel when AI is typing
            <motion.div
              initial={{ x: '100%', opacity: 0 }} // Start off-screen to the right
              animate={{ x: 0, opacity: 1 }}     // Slide in to position
              exit={{ x: '100%', opacity: 0 }}      // Slide out to the right when no longer typing
              transition={{ type: "tween", duration: 0.3 }} // Smooth transition
              className="max-w-[85%] w-fit rounded-lg ml-auto bg-gray-800 p-3 text-white flex flex-col items-center justify-center min-h-[80px] border border-gray-700 shadow-md text-center"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-300">KI generiert Antwort...</span>
              <img src="/lovable-uploads/Screenshot_20250607-010309.jpg-7b5000ad-bb12-4e1a-bad2-641f9241a37a" alt="Placeholder AI Panel" className="mt-2 w-full h-auto max-h-[150px] object-contain rounded" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Display example prompts only if there's just the welcome message */}
        {messages.length === 1 && messages[0].id === 'welcome' && (
          <div className="bg-black max-w-[85%] rounded-lg p-3 border border-black mt-4">
            <p className="text-sm text-red-200 mb-2">
              Frag mich zum Beispiel:
            </p>
            <div className="flex flex-col gap-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start bg-black hover:bg-gray-900 text-red-200 border-black"
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
    </div>
  );
};

export default MessageList;