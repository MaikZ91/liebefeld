
import React from 'react';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isConsecutive = false }) => {
  return (
    <div className={`p-4 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} bg-gray-800 text-white shadow-md w-full max-w-full overflow-hidden`}>
      <div className="whitespace-pre-wrap break-words w-full text-lg md:text-xl font-bold">
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
