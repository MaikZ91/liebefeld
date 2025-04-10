
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { TypingUser } from '@/types/chatTypes';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;
  
  return (
    <div className="flex items-start gap-2 mt-2">
      <div className="flex items-center gap-1">
        <Avatar className="h-6 w-6">
          <AvatarImage 
            src={typingUsers[0].avatar} 
            alt={typingUsers[0].username} 
          />
          <AvatarFallback>
            {getInitials(typingUsers[0].username)}
          </AvatarFallback>
        </Avatar>
        <div className="bg-muted p-2 rounded-full text-xs">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
