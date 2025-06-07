
import React from 'react';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessageListProps } from './types';
import EventSwiperMessage from './EventSwiperMessage';
import './MessageList.css';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  handleDateSelect,
  messagesEndRef,
  examplePrompts,
  handleExamplePromptClick
}) => {
  const renderMessages = () => {
    return messages.map((message) => {
      // Check if message should show event swiper
      const shouldShowEventSwiper = message.text.toLowerCase().includes('event') && 
                                  (message.text.toLowerCase().includes('zeig') || 
                                   message.text.toLowerCase().includes('such') ||
                                   message.text.toLowerCase().includes('find'));
      
      return (
        <div key={message.id}>
          <div
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
          
          {/* Show EventSwiper for AI responses about events */}
          {!message.isUser && shouldShowEventSwiper && (
            <div className="mt-3 max-w-[85%]">
              <EventSwiperMessage />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3 pb-2 px-1">
        {renderMessages()}
        
        {isTyping && (
          <div className="bg-black max-w-[85%] rounded-lg p-3 border border-black">
            <div className="flex space-x-2 items-center">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
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
            
            {/* Add Event Swiper Example */}
            <div className="mt-4">
              <p className="text-sm text-red-200 mb-2">
                Oder entdecke Events:
              </p>
              <EventSwiperMessage />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
