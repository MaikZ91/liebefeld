
import React from 'react';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessageListProps } from './types';
import SwipeableEventPanel from './SwipeableEventPanel';
import SwipeableLandingPanel from './SwipeableLandingPanel';
import TypewriterPrompt from './TypewriterPrompt';

import './MessageList.css'; 

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  handleDateSelect,
  messagesEndRef,
  examplePrompts,
  handleExamplePromptClick,
  onJoinEventChat
}) => {
  // Es wird explizit nach dem statischen Willkommensprompt gesucht
  const welcomeMessage = messages.find(m => m.id === 'welcome');
  const typewriterPromptMessage = messages.find(m => m.id === 'typewriter-prompt');
  const landingSlideMessage = messages.find(m => m.id === 'landing-slides');

  // Alle übrigen Nachrichten (z. B. Bot-/User-Messages/Panels/HTML)
  const mainMessages = messages
    .filter(m => !['welcome', 'typewriter-prompt', 'landing-slides'].includes(m.id));

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3 pb-2 px-1">
        {/* Optisch schöne Welcome Nachricht */}
        {welcomeMessage && welcomeMessage.html && (
          <div className="flex justify-center animate-fade-in-fast">
            <div dangerouslySetInnerHTML={{ __html: welcomeMessage.html }} />
          </div>
        )}

        {/* Schreibmaschinen-Prompt - Verwende examplePrompts aus Props */}
        {typewriterPromptMessage && examplePrompts && examplePrompts.length > 0 && (
          <TypewriterPrompt
            prompts={examplePrompts}
            onPromptClick={handleExamplePromptClick}
            loopInterval={3000}
            typingSpeed={40}
          />
        )}

        {/* Landing Panel als Slides */}
        {landingSlideMessage && landingSlideMessage.slideData && (
          <div className="flex justify-center">
            <div className="w-full max-w-md mx-auto">
              <SwipeableLandingPanel slideData={landingSlideMessage.slideData} />
            </div>
          </div>
        )}

        {/* Restliche Chat- und Bot-Messages */}
        {mainMessages.map((message) => {
          // Panel
          if (message.panelData) {
            return (
              <div key={message.id} className={cn("max-w-[85%] rounded-lg bg-black border border-black", message.isEventNotification && "border-red-500/50 bg-red-900/10")}>
                <div className="p-3">
                  <SwipeableEventPanel 
                    panelData={message.panelData}
                    onEventSelect={(eventId) => {
                      console.log('Event selected:', eventId);
                    }}
                    onJoinEventChat={onJoinEventChat}
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
          // Standard
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
        })}
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
