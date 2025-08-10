
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
  transparentBg?: boolean;
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
  transparentBg = false
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
                className="text-red-400 hover:text-red-300 underline break-all flex items-center"
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
                  <div class="bg-black border border-black rounded-lg p-2 mb-2">
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

  const messageContent = (
    <div
      className={cn(
        "group p-3 rounded-lg relative",
        isConsecutive ? 'mt-0.5' : 'mt-1',
        transparentBg
          ? "bg-transparent text-white shadow-none w-full max-w-full overflow-visible"
          : "bg-black text-white shadow-md w-full max-w-full overflow-hidden hover:bg-gray-900/50 transition-colors duration-200"
      )}
    >
      {/* Outer flex container for text and reactions */}
      <div className="flex flex-col">
        <div className="chat-message-bubble">
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
