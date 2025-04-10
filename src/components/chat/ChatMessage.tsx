
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isConsecutive = false }) => {
  return (
    <div className={`p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} bg-gray-800 text-white shadow-md w-full max-w-full overflow-hidden`}>
      <ScrollArea className="max-h-[200px]">
        <div className="whitespace-pre-wrap break-words w-full text-base font-medium">
          {message}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatMessage;
