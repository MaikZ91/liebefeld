
import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/utils/chatUIUtils';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { Message, TypingUser, EventShare } from '@/types/chatTypes';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';

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
  const whatsAppLink = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
  
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

  return (
    <div className="flex-grow p-4 bg-[#f0f2f5] dark:bg-[#111b21] overflow-y-auto w-full max-w-full h-full flex flex-col">
      {loading && (
        <div className="text-center text-gray-500 text-lg font-semibold py-4">Loading messages...</div>
      )}
      
      {error && (
        <div className="text-center text-red-500 text-lg font-semibold py-4">Error: {error}</div>
      )}

      <ScrollArea className="h-full w-full pr-2 flex-grow" type={isMobile ? "always" : "hover"}>
        <div className="flex flex-col space-y-1 w-full max-w-full pb-4">
          {messages.length === 0 && !loading && !error && (
            <div className="text-center text-gray-400 py-4 rounded-md bg-white dark:bg-gray-800 shadow-sm p-3">
              No messages yet. Start the conversation!
            </div>
          )}
          
          {messages.map((message, index) => {
            const isConsecutive = index > 0 && messages[index - 1].user_name === message.user_name;
            const timeAgo = formatTime(message.created_at);
            const isCurrentUser = message.user_name === username;
            
            // Check if this is a system message about WhatsApp
            const isWhatsAppMessage = message.user_name === 'System' && 
                                      message.content && 
                                      message.content.includes('WhatsApp');
            
            if (isWhatsAppMessage) {
              return (
                <div key={message.id} className="my-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="font-medium mb-3 text-gray-800 dark:text-white">
                    Die Community Interaktion findet derzeit auf WhatsApp statt.
                  </div>
                  <a 
                    href={whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-md transition-colors"
                  >
                    <Link className="h-4 w-4" />
                    WhatsApp Community beitreten
                  </a>
                </div>
              );
            }
            
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
              <div 
                key={message.id} 
                className={`mb-1 w-full max-w-full overflow-hidden flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {!isConsecutive && !isCurrentUser && (
                    <div className="flex items-center mb-1 ml-1">
                      <Avatar className={`h-6 w-6 mr-2 flex-shrink-0 ${isGroup ? 'border-red-500' : ''}`}>
                        <AvatarImage src={message.user_avatar} alt={message.user_name} />
                        <AvatarFallback className="bg-gray-500 text-white text-xs">{getInitials(message.user_name)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{message.user_name}</div>
                    </div>
                  )}
                  
                  <div className="flex items-end gap-1">
                    <div className={`rounded-lg px-3 py-2 overflow-hidden break-words shadow-sm
                      ${isCurrentUser 
                        ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-black dark:text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-700 text-black dark:text-white rounded-tl-none'
                      }`}
                    >
                      <ChatMessage 
                        message={messageContent} 
                        isConsecutive={isConsecutive}
                        isGroup={isGroup}
                        eventData={eventData}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 float-right ml-2 mt-1">{timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <TypingIndicator typingUsers={typingUsers} />
          
          {/* WhatsApp message at the bottom */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="font-medium mb-3 text-gray-800 dark:text-white">
              Die Community Interaktion findet derzeit auf WhatsApp statt.
            </div>
            <a 
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-md transition-colors"
            >
              <Link className="h-4 w-4" />
              WhatsApp Community beitreten
            </a>
          </div>
          
          <div ref={chatBottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
