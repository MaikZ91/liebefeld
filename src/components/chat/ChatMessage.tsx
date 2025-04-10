
import React from 'react';

interface ChatMessageProps {
  message: string;
  isConsecutive?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isConsecutive = false }) => {
  return (
    <div className={`max-w-[90%] p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} bg-gray-800 text-white shadow-md break-words overflow-hidden`}>
      <div className="w-full whitespace-normal break-words overflow-wrap-anywhere">
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
