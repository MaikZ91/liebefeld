
import React, { useState, useEffect } from 'react';
import { EventShare } from '@/types/chatTypes';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventMessageFormatter from './EventMessageFormatter';
import MessageContextMenu from './MessageContextMenu';
import MessageReactions from './MessageReactions';
import { colorizeHashtags } from '@/utils/hashtagUtils';
import { getChannelColor } from '@/utils/channelColors';

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
  onJoinEventChat
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  const detectGroupType = (text: string): 'ausgehen' | 'sport' | 'kreativität' => {
    const t = (text || '').toLowerCase();
    if (t.includes('#sport')) return 'sport';
    if (t.includes('#kreativität') || t.includes('#kreativ')) return 'kreativität';
    return 'ausgehen';
  };

  const groupType = typeof message === 'string' ? detectGroupType(message) : 'ausgehen';
  const colors = getChannelColor(groupType);

  const messageContent = (
    <div
      className={cn(
        "group px-4 py-3 rounded-2xl relative w-full max-w-full overflow-hidden transition-all duration-200",
        isConsecutive ? 'mt-1' : 'mt-2',
        "text-white"
      )}
      style={{ 
        background: 'rgba(0, 0, 0, 0.8)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        borderTop: `0.5px solid ${getGroupColor(groupType).border}`,
        borderRadius: '16px'
      }}
    >
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
  );

  // Only wrap in context menu if we have reaction capability AND we're in group mode
  if (onReact && messageId && isGroup) {
    return (
      <MessageContextMenu onReact={handleReact}>
        {messageContent}
      </MessageContextMenu>
    );
  }

  return messageContent;
};

export default ChatMessage;
