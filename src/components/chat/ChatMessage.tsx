
import React from 'react';
import { EventShare } from '@/types/chatTypes';
import EventMessageFormatter from './EventMessageFormatter';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
  isGroup?: boolean;
  eventData?: EventShare;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isConsecutive = false, 
  isGroup = false,
  eventData
}) => {
  // Format message content - extract event data if present
  const formatContent = () => {
    if (eventData) {
      return (
        <div className="space-y-2">
          <EventMessageFormatter event={eventData} />
          {message && message.trim() !== '' && (
            <div className="whitespace-pre-wrap mt-2">{message}</div>
          )}
        </div>
      );
    }
    
    return <div className="whitespace-pre-wrap">{message}</div>;
  };
  
  return (
    <div 
      className={`p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} ${
        isGroup ? 'bg-[#222632] text-white' : 'bg-gray-800 text-white'
      } shadow-md w-full max-w-full overflow-hidden break-words`}
    >
      <div className="w-full max-w-full overflow-hidden break-words">
        {formatContent()}
      </div>
    </div>
  );
};

export default ChatMessage;
