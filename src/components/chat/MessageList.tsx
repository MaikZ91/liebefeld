
import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/utils/chatUIUtils';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { Message, TypingUser, EventShare } from '@/types/chatTypes';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatLoadingSkeleton from './ChatLoadingSkeleton';
import { reactionService } from '@/services/reactionService';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  username: string;
  typingUsers: TypingUser[];
  formatTime: (isoDateString: string) => string;
  isGroup: boolean;
  groupType: 'ausgehen' | 'sport' | 'kreativität';
  chatBottomRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  error,
  username,
  typingUsers,
  formatTime,
  isGroup,
  groupType,
  chatBottomRef
}) => {
  const isMobile = useIsMobile();
  
  // Force scroll to bottom on initial render for mobile
  useEffect(() => {
    if (isMobile && chatBottomRef.current) {
      setTimeout(() => {
        chatBottomRef.current.scrollIntoView({ behavior: 'auto' });
      }, 500);
    }
  }, [isMobile, chatBottomRef]);

  // Parse event data from message content if available
  const parseEventData = (message: Message): EventShare | undefined => {
    try {
      if (typeof message.content === 'string' && message.content.includes('🗓️ **Event:')) {
        // Extract event data from formatted message content
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
      }
      
      return undefined;
    } catch (error) {
      console.error("Error parsing event data:", error);
      return undefined;
    }
  };

  // Handle reaction toggle
  const handleReaction = (messageId: string) => {
    return async (emoji: string) => {
      try {
        console.log('MessageList: Toggling reaction:', { messageId, emoji, username });
        const success = await reactionService.toggleReaction(messageId, emoji, username);
        if (!success) {
          console.error('Failed to toggle reaction');
        } else {
          console.log('Reaction toggled successfully');
        }
      } catch (error) {
        console.error('Error toggling reaction:', error);
      }
    };
  };

  // Show loading skeleton during initial load
  if (loading) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <div className={`flex-grow p-4 bg-black overflow-y-auto w-full max-w-full h-full flex flex-col`}>
      {error && (
        <div className="text-center text-red-500 text-lg font-semibold py-4">Error: {error}</div>
      )}

      <ScrollArea className="h-full w-full pr-2 flex-grow" type={isMobile ? "always" : "hover"}>
        <div className="flex flex-col space-y-2 w-full max-w-full pb-4">
          {messages.length === 0 && !loading && !error && (
            <div className="text-center text-gray-400 py-4">No messages yet. Start the conversation!</div>
          )}
          
          {messages.map((message, index) => {
            const isConsecutive = index > 0 && messages[index - 1].user_name === message.user_name;
            const timeAgo = formatTime(message.created_at);
            
            // Parse event data
            let eventData: EventShare | undefined;
            let messageContent = message.content;
            
            try {
              eventData = parseEventData(message);
              
              // Remove event data from message content if present
              if (eventData && typeof message.content === 'string' && message.content.includes('🗓️ **Event:')) {
                messageContent = message.content.replace(/🗓️ \*\*Event:.*?\n\n/s, '').trim();
              }
            } catch (error) {
              console.error("Failed to parse event data:", error);
            }

            return (
              <div key={message.id} className="mb-1 w-full max-w-full overflow-hidden">
                {!isConsecutive && (
                  <div className="flex items-center mb-1">
                    <Avatar className={`h-8 w-8 mr-2 flex-shrink-0 ${isGroup ? 'border-red-500' : ''}`}>
                      <AvatarImage src={message.user_avatar} alt={message.user_name} />
                      <AvatarFallback className="bg-red-500 text-white">{getInitials(message.user_name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-lg font-medium text-white mr-2">{message.user_name}</div>
                    <span className="text-sm text-gray-400">{timeAgo}</span>
                  </div>
                )}
                <div className="w-full max-w-full overflow-hidden break-words">
                  <ChatMessage 
                    message={messageContent} 
                    isConsecutive={isConsecutive}
                    isGroup={isGroup}
                    eventData={eventData}
                    messageId={message.id}
                    reactions={message.reactions || []}
                    onReact={handleReaction(message.id)}
                    currentUsername={username}
                  />
                </div>
              </div>
            );
          })}
          
          <TypingIndicator typingUsers={typingUsers} />
          
          <div ref={chatBottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
