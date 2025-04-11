
import React, { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { TypingUser, EventShare } from '@/types/chatTypes';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_name: string;
  user_avatar: string;
  group_id: string;
  event_data?: EventShare;
}

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  username: string;
  typingUsers: TypingUser[];
  formatTime: (isoDateString: string) => string;
  isSpotGroup: boolean;
  isSportGroup: boolean;
  isAusgehenGroup: boolean;
  chatBottomRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  error,
  username,
  typingUsers,
  formatTime,
  isSpotGroup,
  isSportGroup,
  isAusgehenGroup,
  chatBottomRef
}) => {
  // Parse event data from message content if available
  const parseEventData = (message: Message): EventShare | undefined => {
    if (message.event_data) return message.event_data;
    
    const eventRegex = /🗓️ \*\*Event: (.*?)\*\*\nDatum: (.*?) um (.*?)\nOrt: (.*?)\nKategorie: (.*?)(\n\n|$)/;
    const match = message.content.match(eventRegex);
    
    if (match) {
      return {
        title: match[1],
        date: match[2],
        time: match[3],
        location: match[4],
        category: match[5]
      };
    }
    
    return undefined;
  };

  return (
    <div 
      className={`flex-grow p-5 ${isSpotGroup || isSportGroup || isAusgehenGroup ? 'bg-[#1A1F2C]' : 'bg-black'} overflow-y-auto w-full`}
    >
      {loading && <div className="text-center text-gray-500 text-lg font-semibold py-4">Loading messages...</div>}
      {error && <div className="text-center text-red-500 text-lg font-semibold py-4">Error: {error}</div>}

      <div className="flex flex-col space-y-3 w-full">
        {messages.length === 0 && !loading && !error && (
          <div className="text-center text-gray-400 py-4">No messages yet. Start the conversation!</div>
        )}
        
        {messages.map((message, index) => {
          const isConsecutive = index > 0 && messages[index - 1].user_name === message.user_name;
          const timeAgo = formatTime(message.created_at);
          const eventData = parseEventData(message);

          return (
            <div key={message.id} className="mb-4 w-full">
              {!isConsecutive && (
                <div className="flex items-center mb-2">
                  <Avatar className={`h-8 w-8 mr-2 flex-shrink-0 ${isSpotGroup || isSportGroup || isAusgehenGroup ? 'border-[#9b87f5]' : ''}`}>
                    <AvatarImage src={message.user_avatar} alt={message.user_name} />
                    <AvatarFallback>{getInitials(message.user_name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-white mr-2">{message.user_name}</div>
                  <span className="text-xs text-gray-400">{timeAgo}</span>
                </div>
              )}
              <div className="w-full max-w-full overflow-hidden">
                <ChatMessage 
                  message={eventData ? message.content.replace(eventData.title, '').replace(/🗓️ \*\*Event:.*?\n\n/s, '') : message.content} 
                  isConsecutive={isConsecutive}
                  isSpotGroup={isSpotGroup || isSportGroup || isAusgehenGroup}
                  eventData={eventData}
                />
              </div>
            </div>
          );
        })}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={chatBottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
