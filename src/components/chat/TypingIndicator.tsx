
import React from 'react';
import { TypingUser } from '@/types/chatTypes';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/utils/chatUIUtils';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 my-2 animate-fade-in">
      {typingUsers.slice(0, 1).map(user => (
        <div key={user.username} className="flex items-start">
          <Avatar className="h-6 w-6 mr-1">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="bg-gray-500 text-white text-xs">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {typingUsers.length > 1 && (
        <span className="text-xs text-gray-500">
          +{typingUsers.length - 1} more typing...
        </span>
      )}
    </div>
  );
};

export default TypingIndicator;
