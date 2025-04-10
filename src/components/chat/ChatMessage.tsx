
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
  isSpotGroup?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isConsecutive = false, isSpotGroup = false }) => {
  return (
    <div 
      className={`p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} ${
        isSpotGroup ? 'bg-[#222632] text-white' : 'bg-gray-800 text-white'
      } shadow-md w-full max-w-full overflow-hidden`}
    >
      <div className="whitespace-pre-wrap break-words w-full text-base font-medium">
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
