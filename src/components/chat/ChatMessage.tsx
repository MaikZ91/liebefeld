
import React from 'react';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isConsecutive = false }) => {
  return (
    <div className={`p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} bg-gray-800 text-white shadow-md w-full`}>
      <div className="whitespace-pre-wrap break-words w-full overflow-hidden">
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
