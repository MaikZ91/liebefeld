
import React, { useState, useEffect, useRef } from 'react';
import { EventShare } from '@/types/chatTypes';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Link as LinkIcon, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventMessageFormatter from './EventMessageFormatter';
import MessageContextMenu from './MessageContextMenu';
import MessageReactions from './MessageReactions';
import { colorizeHashtags } from '@/utils/hashtagUtils';
import { getChannelColor } from '@/utils/channelColors';
import { ReplyData } from '@/hooks/chat/useReplySystem';

const getGroupColor = (groupType: string) => {
  switch (groupType.toLowerCase()) {
    case 'sport': 
      return { 
        bg: 'linear-gradient(135deg, rgba(54, 144, 255, 0.12) 0%, rgba(54, 144, 255, 0.08) 50%, rgba(54, 144, 255, 0.05) 100%)',
        border: '#3690FF',
        glow: 'rgba(54, 144, 255, 0.15)'
      };
    case 'ausgehen': 
      return { 
        bg: 'linear-gradient(135deg, rgba(255, 77, 77, 0.12) 0%, rgba(255, 77, 77, 0.08) 50%, rgba(255, 77, 77, 0.05) 100%)',
        border: '#FF4D4D',
        glow: 'rgba(255, 77, 77, 0.15)'
      };
    case 'kreativität': 
      return { 
        bg: 'linear-gradient(135deg, rgba(255, 193, 7, 0.12) 0%, rgba(255, 193, 7, 0.08) 50%, rgba(255, 193, 7, 0.05) 100%)',
        border: '#FFC107',
        glow: 'rgba(255, 193, 7, 0.15)'
      };
    default: 
      return { 
        bg: 'linear-gradient(135deg, rgba(255, 77, 77, 0.12) 0%, rgba(255, 77, 77, 0.08) 50%, rgba(255, 77, 77, 0.05) 100%)',
        border: '#FF4D4D',
        glow: 'rgba(255, 77, 77, 0.15)'
      };
  }
};

interface ChatMessageProps {
  message: string | React.ReactNode;
  isConsecutive?: boolean;
  isGroup?: boolean;
  eventData?: EventShare;
  eventId?: string;
  onDateSelect?: (date: string) => void;
  showDateSelector?: boolean;
  reactions?: { emoji: string; users: string[] }[];
  onReact?: (emoji: string) => void;
  currentUsername?: string;
  messageId?: string;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  pollQuestion?: string;
  pollOptions?: string[];
  pollVotes?: { [optionIndex: number]: string[] };
  onReply?: (replyData: ReplyData) => void;
  sender?: string;
  avatar?: string;
  replyTo?: ReplyData | null;
  onScrollToMessage?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isConsecutive = false,
  isGroup = false,
  eventData,
  eventId,
  onDateSelect,
  showDateSelector = false,
  reactions = [],
  onReact,
  currentUsername = '',
  messageId,
  onJoinEventChat,
  onReply,
  sender,
  avatar,
  replyTo,
  onScrollToMessage
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Swipe gesture detection
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Check if message contains event information
  const containsEventInfo = (text: string): boolean => {
    if (!text) return false;
    const eventKeywords = ['um', 'uhr', 'findet', 'statt', 'kategorie', 'veranstaltung', 'event'];
    const lowerText = text.toLowerCase();
    return eventKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Function to convert URLs to clickable links
  const renderMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    if (!text.match(urlRegex)) {
      return text;
    }

    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];

    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {matches[i] && (
              <a
                href={matches[i]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:opacity-90 underline break-all flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {matches[i]}
                <LinkIcon className="h-3 w-3 ml-1 inline" />
              </a>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  // Format event-like text into styled event cards
  const formatEventText = (text: string) => {
    if (!containsEventInfo(text)) return text;

    const lines = text.split("\n");
    let formattedContent = "";

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (!line) {
        formattedContent += "<p></p>";
        continue;
      }

      line = line.replace(/^[•\-*]\s*/, '');

      if (line.toLowerCase().includes("event:") || line.toLowerCase().includes("datum:")) {
          const eventRegex = /^(.*?) um (.*?) (?:in|bei|im) (.*?) \(Kategorie: (.*?)\)$/i;
          const match = line.match(eventRegex);
          if (match) {
              const [_, title, time, location, category] = match;
              formattedContent += `
                  <div class="bg-muted/30 border border-border rounded-lg p-2 mb-2">
                      <div class="font-bold">${title}</div>
                      <div>Zeit: ${time}, Ort: ${location}, Kategorie: ${category}</div>
                  </div>
              `;
          } else {
              formattedContent += `<p>${line}</p>`;
          }
      } else {
          formattedContent += `<p>${line}</p>`;
      }
    }

    return formattedContent;
  };

  // Format message content - extract event data if present
  const formatContent = () => {
    if (eventData) {
      return <EventMessageFormatter event={eventData} eventId={eventId} onJoinEventChat={onJoinEventChat} />;
    }

    if (typeof message === 'string') {
      if (containsEventInfo(message)) {
        return (
          <div
            className="whitespace-pre-wrap chat-message-content"
            dangerouslySetInnerHTML={{ __html: formatEventText(message) }}
          />
        );
      }
      return (
        <span className="whitespace-pre-wrap chat-message-content">
          {colorizeHashtags(message)}
        </span>
      );
    }

    return (
      <span className="whitespace-pre-wrap chat-message-content">
        {message}
      </span>
    );
  };

  const handleReact = (emoji: string) => {
    console.log('ChatMessage: handling reaction', { emoji, messageId, currentUsername });
    if (onReact && messageId) {
      onReact(emoji);
    } else {
      console.warn('ChatMessage: Missing onReact handler or messageId', { onReact: !!onReact, messageId });
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onReply || !messageId || !sender) return;
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !onReply) return;
    
    currentXRef.current = e.touches[0].clientX;
    const deltaX = currentXRef.current - startXRef.current;
    
    // Only allow swipe to the right (positive deltaX) and limit to 80px
    const offset = Math.max(0, Math.min(deltaX, 80));
    setSwipeOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !onReply || !messageId || !sender) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    
    // Trigger reply if swiped more than 60px to the right
    if (deltaX > 60) {
      const messageText = typeof message === 'string' ? message : '';
      const replyData = {
        messageId,
        sender,
        text: messageText,
        avatar
      };
      onReply(replyData);
    }
    
    // Reset swipe state
    setIsDragging(false);
    setSwipeOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onReply || !messageId || !sender) return;
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !onReply) return;
    
    currentXRef.current = e.clientX;
    const deltaX = currentXRef.current - startXRef.current;
    
    // Only allow swipe to the right (positive deltaX) and limit to 80px
    const offset = Math.max(0, Math.min(deltaX, 80));
    setSwipeOffset(offset);
  };

  const handleMouseUp = () => {
    if (!isDragging || !onReply || !messageId || !sender) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    
    // Trigger reply if swiped more than 60px to the right
    if (deltaX > 60) {
      const messageText = typeof message === 'string' ? message : '';
      const replyData = {
        messageId,
        sender,
        text: messageText,
        avatar
      };
      onReply(replyData);
    }
    
    // Reset swipe state
    setIsDragging(false);
    setSwipeOffset(0);
  };

  const detectGroupType = (text: string): 'ausgehen' | 'sport' | 'kreativität' => {
    const t = (text || '').toLowerCase();
    if (t.includes('#sport')) return 'sport';
    if (t.includes('#kreativität') || t.includes('#kreativ')) return 'kreativität';
    return 'ausgehen';
  };

  const groupType = typeof message === 'string' ? detectGroupType(message) : 'ausgehen';
  const colors = getChannelColor(groupType);

  const messageContent = (
    <div className="relative">
      {/* Reply indicator that shows during swipe */}
      {swipeOffset > 0 && onReply && (
        <div 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex items-center gap-2 text-primary cursor-pointer select-none"
          style={{ opacity: Math.min(swipeOffset / 100, 1) }}
          onClick={(e) => {
            e.stopPropagation();
            if (onReply && messageId && sender) {
              const messageText = typeof message === 'string' ? message : '';
              onReply({ messageId, sender, text: messageText, avatar });
              setIsDragging(false);
              setSwipeOffset(0);
            }
          }}
        >
          <Reply className="h-5 w-5" />
          <span className="text-sm font-medium">Zitieren</span>
        </div>
      )}
      
      <div
        className={cn(
          "group px-4 py-3 rounded-2xl relative w-full max-w-full overflow-hidden transition-all duration-200 select-none",
          isConsecutive ? 'mt-1' : 'mt-2',
          "text-white cursor-pointer"
        )}
        style={{ 
          background: 'rgba(0, 0, 0, 0.8)',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          borderTop: `0.5px solid ${getGroupColor(groupType).border}`,
          borderRadius: '16px',
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Handle mouse leave as mouse up
      >
        {/* Reply indicator inside message - enhanced visibility */}
        {replyTo && (
          <div 
            className="mb-3 p-3 rounded-lg border-l-4 backdrop-blur-sm cursor-pointer transition-colors"
            style={{
              background: `linear-gradient(to right, ${getChannelColor(detectGroupType(typeof message === 'string' ? message : '')).primary}20, ${getChannelColor(detectGroupType(typeof message === 'string' ? message : '')).primary}10)`,
              borderLeftColor: getChannelColor(detectGroupType(typeof message === 'string' ? message : '')).primary
            }}
            onMouseEnter={(e) => {
              const groupType = detectGroupType(typeof message === 'string' ? message : '');
              e.currentTarget.style.background = `linear-gradient(to right, ${getChannelColor(groupType).primary}25, ${getChannelColor(groupType).primary}15)`;
            }}
            onMouseLeave={(e) => {
              const groupType = detectGroupType(typeof message === 'string' ? message : '');
              e.currentTarget.style.background = `linear-gradient(to right, ${getChannelColor(groupType).primary}20, ${getChannelColor(groupType).primary}10)`;
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onScrollToMessage && replyTo.messageId) {
                onScrollToMessage(replyTo.messageId);
              }
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Reply className="h-3 w-3" style={{ color: getChannelColor(detectGroupType(typeof message === 'string' ? message : '')).primary }} />
              <div className="text-xs font-medium" style={{ color: getChannelColor(detectGroupType(typeof message === 'string' ? message : '')).primary }}>Antwort an {replyTo.sender}</div>
            </div>
            <div className="text-sm text-white/80 font-medium leading-relaxed">
              "{replyTo.text.length > 60 ? replyTo.text.substring(0, 60) + '...' : replyTo.text}"
            </div>
          </div>
        )}
        
        {/* Outer flex container for text and reactions */}
        <div className="flex flex-col relative z-10">
          <div className="chat-message-bubble w-full">
            {formatContent()}
          </div>

          {/* Reactions container, now explicitly below the text content */}
          {(reactions && reactions.length > 0) || (onReact && messageId && isGroup) ? (
            <div className="message-reactions-container mt-1">
              <MessageReactions
                reactions={reactions}
                onReact={handleReact}
                currentUsername={currentUsername}
                showAddButton={onReact && messageId && isGroup}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  // Only wrap in context menu if we have reaction capability AND we're in group mode
  if (onReact && messageId && isGroup) {
    const contextMenuReplyData = onReply && messageId && sender ? {
      messageId,
      sender,
      text: typeof message === 'string' ? message : '',
      avatar
    } : undefined;
    
    return (
      <MessageContextMenu 
        onReact={handleReact}
        onReply={onReply}
        replyData={contextMenuReplyData}
      >
        {messageContent}
      </MessageContextMenu>
    );
  }

  return messageContent;
};

export default ChatMessage;
