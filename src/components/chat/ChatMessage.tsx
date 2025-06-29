
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MessageReactions from './MessageReactions';
import ReactionBar from './ReactionBar';
import EventMessageFormatter from './EventMessageFormatter';
import { EventShare } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
  isGroup?: boolean;
  eventData?: EventShare;
  messageId: string;
  reactions: { emoji: string; users: string[] }[];
  onReact: (emoji: string) => void;
  currentUsername: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isConsecutive = false,
  isGroup = false,
  eventData,
  messageId,
  reactions,
  onReact,
  currentUsername
}) => {
  const [showReactionBar, setShowReactionBar] = useState(false);

  const handleReactionClick = (emoji: string) => {
    onReact(emoji);
    setShowReactionBar(false);
  };

  // Check if message has event data (for mirrored event messages)
  const hasEventData = message.includes('event_id:') || eventData;
  
  // Extract event data from message if it's a mirrored event message
  let eventMessageData = null;
  if (message.includes('event_id:')) {
    const lines = message.split('\n');
    eventMessageData = {
      id: messageId,
      text: lines[0] || message,
      event_id: lines.find(l => l.startsWith('event_id:'))?.replace('event_id:', ''),
      event_title: lines.find(l => l.startsWith('event_title:'))?.replace('event_title:', ''),
      event_date: lines.find(l => l.startsWith('event_date:'))?.replace('event_date:', ''),
      event_location: lines.find(l => l.startsWith('event_location:'))?.replace('event_location:', ''),
      event_image_url: lines.find(l => l.startsWith('event_image_url:'))?.replace('event_image_url:', '')
    };
  }

  return (
    <div className="relative group">
      <Card className={`p-3 ${isConsecutive ? 'ml-10' : ''} ${isGroup ? 'bg-gray-900' : 'bg-gray-800'} border-gray-700 text-white break-words overflow-hidden max-w-full`}>
        {/* Regular event data display */}
        {eventData && (
          <div className="mb-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              {eventData && (
                <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎉</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-red-300 mb-1">{eventData.title}</h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{eventData.date} um {eventData.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{eventData.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🏷️</span>
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                      {eventData.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message content with event formatting */}
        <div className="prose prose-invert max-w-none">
          {eventMessageData ? (
            <EventMessageFormatter message={eventMessageData} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: message }} />
          )}
        </div>

        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <MessageReactions 
            reactions={reactions} 
            onReact={handleReactionClick}
            currentUsername={currentUsername}
          />
        )}
      </Card>

      {/* Reaction Bar */}
      {showReactionBar && (
        <div className="absolute top-0 right-0 transform -translate-y-full z-10">
          <ReactionBar onReact={handleReactionClick} />
        </div>
      )}

      {/* Hover to show reaction button */}
      <div 
        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${showReactionBar ? 'opacity-100' : ''}`}
      >
        <button
          onClick={() => setShowReactionBar(!showReactionBar)}
          className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700"
        >
          😊
        </button>
      </div>
    </div>
  );
};

export default ChatMessage;
