
import React from 'react';
import { EventShare } from '@/types/chatTypes';
import { EventMessageFormatter } from './EventMessageFormatter';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
  isGroup?: boolean;
  eventData?: EventShare;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isConsecutive = false, isGroup = false, eventData }) => {
  if (eventData) {
    return <EventMessageFormatter event={eventData} />;
  }
  
  return (
    <div className={`p-3 rounded-lg overflow-hidden break-words w-full max-w-full ${isGroup ? 'bg-[#23283a]' : 'bg-zinc-800'} ${!isConsecutive ? 'mt-1' : ''}`}>
      <div 
        className="text-white text-sm whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
};

export default ChatMessage;
