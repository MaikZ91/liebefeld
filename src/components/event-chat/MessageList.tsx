import React, { useState, useEffect } from 'react';
import { MessageListProps } from './types';
import SwipeableEventPanel from './SwipeableEventPanel';
import OnboardingPanel from './OnboardingPanel';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './MessageList.css';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  handleDateSelect,
  messagesEndRef,
  examplePrompts,
  handleExamplePromptClick
}) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding should be shown (first visit or no messages)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('tribe-onboarding-completed');
    if (!hasSeenOnboarding && messages.length === 0) {
      setShowOnboarding(true);
    }
  }, [messages.length]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('tribe-onboarding-completed', 'true');
  };

  const handleCreateProfile = () => {
    // This would trigger profile creation dialog
    console.log('Create profile clicked');
    handleOnboardingComplete();
  };

  const handleOpenCommunity = () => {
    // This would switch to community chat mode
    console.log('Open community clicked');
    handleOnboardingComplete();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Show onboarding if no messages and first visit */}
      {showOnboarding && messages.length === 0 && (
        <OnboardingPanel
          onComplete={handleOnboardingComplete}
          onCreateProfile={handleCreateProfile}
          onOpenCommunity={handleOpenCommunity}
        />
      )}

      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 ${
              message.isUser
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-100 border border-gray-700'
            }`}
          >
            {message.html ? (
              <div dangerouslySetInnerHTML={{ __html: message.html }} />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            )}
            
            {/* Render panel if panelData exists */}
            {message.panelData && (
              <div className="mt-3">
                <SwipeableEventPanel
                  panelData={message.panelData}
                  onEventSelect={(eventId) => console.log('Event selected:', eventId)}
                />
              </div>
            )}
            
            {message.timestamp && (
              <div className="text-xs text-gray-400 mt-1">
                {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Show welcome prompts if no messages and onboarding is complete */}
      {messages.length === 0 && !showOnboarding && (
        <div className="flex flex-col space-y-2 mt-4">
          <p className="text-sm text-gray-400 text-center mb-3">
            Wie kann ich dir heute helfen?
          </p>
          {examplePrompts.slice(0, 3).map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              className="bg-gray-800 text-red-300 border-gray-700 hover:bg-gray-700 hover:text-red-200 text-left text-sm justify-start h-auto py-3 px-4"
              onClick={() => handleExamplePromptClick(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 max-w-[85%]">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
