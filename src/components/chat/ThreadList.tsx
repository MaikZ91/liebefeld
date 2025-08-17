import React from 'react';
import { Message } from '@/types/chatTypes';
import ChatMessage from './ChatMessage';

interface ThreadListProps {
  threadMessages: Message[];
  formatTime: (isoDateString: string) => string;
  onReply: (parentId: string) => void;
  isExpanded: boolean;
  previewCount?: number;
}

export const ThreadList: React.FC<ThreadListProps> = ({ 
  threadMessages, 
  formatTime, 
  onReply,
  isExpanded,
  previewCount = 2
}) => {
  if (threadMessages.length === 0) return null;

  const displayMessages = isExpanded 
    ? threadMessages 
    : threadMessages.slice(0, previewCount);

  return (
    <div className="ml-8 pl-4 border-l-2 border-muted mt-2 space-y-2">
      {displayMessages.map((message, index) => (
        <div key={message.id} className="animate-fade-in">
          <div className="flex items-start space-x-2 group">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {message.user_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="text-xs font-medium text-foreground">
                  {message.user_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <ChatMessage
                message={message.text}
                reactions={message.reactions}
                messageId={message.id}
                isGroup={true}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};