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
    return messages.map((message) => {
      // Spezieller Render für Promptvorschläge
      if (message.id === 'static-prompts' && message.examplePrompts) {
        return (
          <div key={message.id} className="bg-black max-w-[85%] rounded-lg p-3 border border-black mt-4">
            <p className="text-sm text-red-200 mb-2">{message.text}</p>
            <div className="flex flex-col gap-2">
              {message.examplePrompts.map((prompt: string, idx: number) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="text-left justify-start bg-black hover:bg-gray-900 text-red-500 border-red-500"
                  onClick={() => handleExamplePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        );
      }

      // Landing Slides Panel
      if (message.slideData) {
        return (
          <div key={message.id} className={cn("max-w-[85%] rounded-lg bg-black border border-black")}>
            <div className="p-3">
              <SwipeableLandingPanel slideData={message.slideData} />
            </div>
          </div>
        );
      }

      // Event Panel
      if (message.panelData) {
        return (
          <div key={message.id} className={cn("max-w-[85%] rounded-lg bg-black border border-black", message.isEventNotification && "border-red-500/50 bg-red-900/10")}>
            <div className="p-3">
              <SwipeableEventPanel 
                panelData={message.panelData}
                onEventSelect={(eventId) => {
                  console.log('Event selected:', eventId);
                }}
              />
            </div>
          </div>
        );
      }

      // HTML Message
      if (message.html) {
        return (
          <div key={message.id} className="max-w-[85%] rounded-lg bg-black border border-black">
            <div dangerouslySetInnerHTML={{ __html: message.html }} className="p-3 event-list-container" />
          </div>
        );
      }

      // Standard Chatnachricht
      return (
        <div
          key={message.id}
          className={cn(
            "max-w-[85%] rounded-lg",
            message.isUser
              ? "bg-black border border-black ml-auto"
              : "bg-black border border-black",
            message.isEventNotification && "border-red-500/50 bg-red-900/10"
          )}
        >
          <ChatMessage 
            message={message.text} 
            isGroup={false} 
            onDateSelect={handleDateSelect}
            showDateSelector={message.isUser && message.text.toLowerCase().includes('event')}
          />
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
