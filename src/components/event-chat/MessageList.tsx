
import React from 'react';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessageListProps } from './types';
import SwipeableEventPanel from './SwipeableEventPanel';
import SwipeableLandingPanel from './SwipeableLandingPanel';
import TypewriterPrompt from './TypewriterPrompt';
import { StreamingChatMessage } from './StreamingChatMessage';
import { FollowUpSuggestions } from './FollowUpSuggestions';
import { RichEventCard } from './RichEventCard';
import { ExportShareMenu } from './ExportShareMenu';
import { MapPin } from 'lucide-react';

import './MessageList.css';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  handleDateSelect,
  messagesEndRef,
  examplePrompts,
  handleExamplePromptClick,
  onJoinEventChat,
  followUpSuggestions = [],
  onFollowUpSelect,
  isStreamingResponse = false,
  onEventLike,
  onEventRSVP,
  location,
  hasLocationPermission,
  onRequestLocation
}) => {
  // Es wird explizit nach dem statischen Willkommensprompt gesucht
  const welcomeMessage = messages.find(m => m.id === 'welcome');
  const typewriterPromptMessage = messages.find(m => m.id === 'typewriter-prompt');
  const landingSlideMessage = messages.find(m => m.id === 'landing-slides');

  // Alle übrigen Nachrichten (z. B. Bot-/User-Messages/Panels/HTML)
  const mainMessages = messages
    .filter(m => !['welcome', 'typewriter-prompt', 'landing-slides'].includes(m.id));

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="space-y-4 pb-4 px-4">
        {/* Optisch schöne Welcome Nachricht */}
        {welcomeMessage && welcomeMessage.html && (
          <div className="flex justify-center animate-fade-in pt-6">
            <div dangerouslySetInnerHTML={{ __html: welcomeMessage.html }} />
          </div>
        )}

        {/* Schreibmaschinen-Prompt - Verwende examplePrompts aus Props */}
        {typewriterPromptMessage && examplePrompts && examplePrompts.length > 0 && (
          <div className="py-4">
            <TypewriterPrompt
              prompts={examplePrompts}
              onPromptClick={handleExamplePromptClick}
              loopInterval={3000}
              typingSpeed={40}
            />
          </div>
        )}

        {/* Landing Panel als Slides */}
        {landingSlideMessage && landingSlideMessage.slideData && (
          <div className="flex justify-center py-4">
            <div className="w-full max-w-md mx-auto">
              <SwipeableLandingPanel slideData={landingSlideMessage.slideData} />
            </div>
          </div>
        )}

        {/* Location Request Button */}
        {!hasLocationPermission && onRequestLocation && (
          <div className="flex justify-center py-4">
            <Button
              onClick={onRequestLocation}
              variant="outline"
              className="border-primary/30 bg-primary/10 hover:bg-primary/20"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Standort freigeben für Events in der Nähe
            </Button>
          </div>
        )}

        {/* Restliche Chat- und Bot-Messages */}
        {mainMessages.map((message, index) => {
          const isLastBotMessage = index === mainMessages.length - 1 && !message.isUser;
          // Panel
          if (message.panelData) {
            return (
              <div key={message.id} className={cn("rounded-xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-white/10 shadow-xl", message.isEventNotification && "border-red-500/50")}>
                <div className="p-4">
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
          // HTML Message (AI Response) with streaming support
          if (message.html) {
            return (
              <div key={message.id} className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-sm border border-red-500/20 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/10 bg-black/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
                        <span className="text-xs text-white font-bold">MIA</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-red-400">MIA</div>
                        <div className="text-xs text-white/50">Event Assistentin</div>
                      </div>
                    </div>
                    
                    {/* Export/Share Menu - only show if we have real Event objects */}
                    {message.richEvents && message.richEvents.length > 0 && (
                      <ExportShareMenu events={message.richEvents} />
                    )}
                  </div>
                  
                  {isLastBotMessage && isStreamingResponse ? (
                    <StreamingChatMessage 
                      content={message.html} 
                      isStreaming={isStreamingResponse} 
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: message.html }} className="p-5 text-white/90 leading-relaxed event-list-container" />
                  )}
                </div>
                
                {/* Rich Event Cards - Interactive Event Cards */}
                {message.richEvents && message.richEvents.length > 0 && onEventLike && onEventRSVP && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {message.richEvents.slice(0, 4).map((event) => (
                      <RichEventCard
                        key={event.id}
                        event={event}
                        onLike={(eventId) => onEventLike(eventId, event)}
                        onRSVP={(eventId) => onEventRSVP(eventId, event)}
                        isLiked={false}
                        attendeeCount={event.likes || 0}
                      />
                    ))}
                  </div>
                )}
                
                {/* Follow-up Suggestions after last bot message */}
                {isLastBotMessage && followUpSuggestions.length > 0 && onFollowUpSelect && (
                  <FollowUpSuggestions 
                    suggestions={followUpSuggestions}
                    onSelect={onFollowUpSelect}
                  />
                )}
              </div>
            );
          }
          // Standard Messages
          return (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl shadow-lg overflow-hidden max-w-[85%] animate-scale-in",
                message.isUser
                  ? "ml-auto bg-gradient-to-br from-red-600 to-red-700 border border-red-500/30"
                  : "bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-sm border border-white/10",
                message.isEventNotification && "border-red-500/50"
              )}
            >
              <div className="p-4">
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
          <div className="rounded-2xl bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-sm border border-red-500/20 shadow-xl overflow-hidden max-w-[85%]">
            <div className="flex items-center gap-3 p-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
                <span className="text-xs text-white font-bold">MIA</span>
              </div>
              <div className="flex space-x-1.5 items-center">
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
