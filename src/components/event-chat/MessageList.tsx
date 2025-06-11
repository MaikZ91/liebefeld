// src/components/event-chat/MessageList.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessageListProps } from './types';
import SwipeableEventPanel from './SwipeableEventPanel';
import SwipeableLandingPanel from './SwipeableLandingPanel';
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
        {/* Render Landing Slides if slideData exists */}
        {message.slideData && (
          <div className="p-3">
            <SwipeableLandingPanel 
              slideData={message.slideData}
            />
          </div>
        )}
        
        {/* Render Panel if panelData exists */}
        {message.panelData && (
          <div className="p-3">
            <SwipeableEventPanel 
              panelData={message.panelData}
              onEventSelect={(eventId) => {
                console.log('Event selected:', eventId);
                // Could trigger additional chat response or navigation
              }}
            />
          </div>
        )}
        
        {/* Render HTML content */}
        {message.html ? (
          <div 
            dangerouslySetInnerHTML={{ __html: message.html }} 
            className="p-3 event-list-container"
          />
        ) : (
          /* Render regular chat message only if no panel data and no slides */
          !message.panelData && !message.slideData && (
            <ChatMessage 
              message={message.text} 
              isGroup={false} 
              onDateSelect={handleDateSelect}
              showDateSelector={message.isUser && message.text.toLowerCase().includes('event')}
            />
          )
        )}
      </div>
    ));
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
                  className="text-left justify-start bg-black hover:bg-gray-900 text-red-500 border-red-500" // Styled red
                  onClick={() => handleExamplePromptClick(prompt)}
                >
                  {prompt} {/* Removed quotation marks */}
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
