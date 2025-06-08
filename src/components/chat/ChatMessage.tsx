// src/components/chat/ChatMessage.tsx

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

interface ChatMessageProps {
  message: string | React.ReactNode;
  isConsecutive?: boolean;
  isGroup?: boolean;
  eventData?: EventShare;
  onDateSelect?: (date: string) => void;
  showDateSelector?: boolean;
  reactions?: { emoji: string; users: string[] }[];
  onReact?: (emoji: string) => void;
  currentUsername?: string;
  messageId?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isConsecutive = false, 
  isGroup = false,
  eventData,
  onDateSelect,
  showDateSelector = false,
  reactions = [],
  onReact,
  currentUsername = '',
  messageId
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
    // URL regex pattern - improved to better match URLs
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

    // Try to detect and format event-like information
    const lines = text.split("\n");
    let formattedContent = "";
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        formattedContent += "<p></p>";
        continue;
      }
      
      // Remove bullet points from the beginning of lines
      line = line.replace(/^[•\-*]\s*/, '');
      
      // Check if this line looks like an event description
      if (line.toLowerCase().includes("event:") || line.toLowerCase().includes("datum:")) { // Use a more specific check here
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
              formattedContent += `<p>${line}</p>`; // Fallback for other lines that might look like event info but aren't
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
      return <EventMessageFormatter event={eventData} />;
    }
    
    // For regular messages, render with links if it's a string
    if (typeof message === 'string') {
      if (containsEventInfo(message)) {
        return (
          <div 
            className="whitespace-pre-wrap" 
            dangerouslySetInnerHTML={{ __html: formatEventText(message) }} 
          />
        );
      }
      return (
        <div className="whitespace-pre-wrap">
          {renderMessageWithLinks(message)}
        </div>
      );
    }
    
    // For React node messages
    return (
      <div className="whitespace-pre-wrap">
        {message}
      </div>
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
      // Changed from flex-col to flex for horizontal alignment
      className={cn(
        "group p-3 rounded-lg flex items-center justify-between relative", // Added items-center justify-between relative
        isConsecutive ? 'mt-0.5' : 'mt-1',
        "bg-black text-white shadow-md w-full max-w-full overflow-hidden break-words hover:bg-gray-900/50 transition-colors duration-200"
      )}
    >
      <div className="w-full max-w-full overflow-hidden break-words">
        {formatContent()}
      </div>
      
      {/* Absolute positioning for reactions, moved inside the message content div */}
      {(reactions && reactions.length > 0) || (onReact && messageId && isGroup) ? (
        <div className="absolute bottom-1 right-1 flex items-center gap-1"> {/* Adjusted positioning */}
          <MessageReactions
            reactions={reactions}
            onReact={handleReact}
            currentUsername={currentUsername}
            showAddButton={onReact && messageId && isGroup}
          />
        </div>
      ) : null}
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
