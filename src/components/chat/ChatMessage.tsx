
import React from 'react';
import { EventShare } from '@/types/chatTypes';
import EventMessageFormatter from './EventMessageFormatter';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
  isSpotGroup?: boolean;
  eventData?: EventShare;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isConsecutive = false, 
  isSpotGroup = false,
  eventData
}) => {
  // Check if message contains event data
  const containsEventData = (typeof message === 'string' && message.includes('🗓️ **Event:')) || eventData;
  
  return (
    <div 
      className={`p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} ${
        isSpotGroup ? 'bg-[#222632] text-white' : 'bg-gray-800 text-white'
      } shadow-md w-full max-w-full overflow-hidden break-words`}
    >
      {containsEventData && eventData ? (
        <div className="w-full max-w-full overflow-hidden break-words">
          <EventMessageFormatter event={eventData} />
          {message && message.trim() !== '' && (
            <div className="whitespace-pre-wrap break-words w-full text-base font-medium mt-2 overflow-hidden">
              {message}
            </div>
          )}
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words w-full text-base font-medium overflow-hidden">
          {message}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
