
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
          // HTML Message (AI Response)
          if (message.html) {
            return (
              <div key={message.id} className="max-w-[85%] rounded-lg bg-gradient-to-br from-gray-900/95 to-black/95 border border-red-500/30 shadow-lg shadow-red-500/10">
                <div className="flex items-start gap-2 p-3 border-b border-red-500/20">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs text-red-500 font-bold">MIA</span>
                  </div>
                  <div className="text-xs text-red-400 font-medium">Event Assistentin</div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: message.html }} className="p-4 event-list-container text-white/90" />
              </div>
            );
          }
          // Standard Messages
          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] rounded-lg shadow-md",
                message.isUser
                  ? "bg-gradient-to-br from-red-600 to-red-700 border border-red-500/50 ml-auto"
                  : "bg-gradient-to-br from-gray-900/95 to-black/95 border border-red-500/30",
                message.isEventNotification && "border-red-500/50 bg-red-900/20"
              )}
            >
              <div className="p-3">
                <ChatMessage 
                  message={message.text} 
                  isGroup={false} 
                  onDateSelect={handleDateSelect}
                  showDateSelector={message.isUser && message.text.toLowerCase().includes('event')}
                />
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 max-w-[85%] rounded-lg p-4 border border-red-500/30 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs text-red-500 font-bold">MIA</span>
              </div>
              <div className="flex space-x-2 items-center">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
