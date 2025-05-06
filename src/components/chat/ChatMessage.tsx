
import React, { useState, useEffect } from 'react';
import { EventShare } from '@/types/chatTypes';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventMessageFormatter from './EventMessageFormatter';

interface ChatMessageProps {
  message: string | React.ReactNode;
  isConsecutive?: boolean;
  isGroup?: boolean;
  eventData?: EventShare;
  onDateSelect?: (date: string) => void;
  showDateSelector?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isConsecutive = false, 
  isGroup = false,
  eventData,
  onDateSelect,
  showDateSelector = false
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Auto-detect if the message looks like a calendar request
  const detectCalendarRequest = () => {
    if (typeof message !== 'string') return false;
    
    const lowerMessage = message.toLowerCase();
    const dateKeywords = [
      'wann', 'heute', 'morgen', 'datum', 'kalender', 'tag', 'monat',
      'events', 'veranstaltungen', 'konzerte', 'party', 'festival',
      'events gibt es', 'events am', 'events für', 'veranstaltungen am',
      'welche', 'was gibt', 'was ist los', 'was läuft', 'was passiert'
    ];
    
    return dateKeywords.some(keyword => lowerMessage.includes(keyword)) || showDateSelector;
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
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline break-all flex items-center"
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
  
  // Format message content - extract event data if present
  const formatContent = () => {
    if (eventData) {
      return <EventMessageFormatter event={eventData} />;
    }
    
    const hasDatePrompt = typeof message === 'string' && detectCalendarRequest();
    
    if (hasDatePrompt && onDateSelect) {
      return (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap">
            {typeof message === 'string' ? renderMessageWithLinks(message) : message}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{date ? format(date, "dd.MM.yyyy") : "Datum wählen"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      const formattedDate = format(newDate, "yyyy-MM-dd");
                      
                      // Close the calendar and submit with a small delay
                      setCalendarOpen(false);
                      
                      // Auto-submit after date selection
                      setTimeout(() => onDateSelect(formattedDate), 300);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="default" 
              className="bg-[#25D366] hover:bg-[#1fb855] w-full sm:w-auto"
              onClick={() => {
                if (date) {
                  onDateSelect(format(date, "yyyy-MM-dd"));
                }
              }}
            >
              Events anzeigen
            </Button>
          </div>
        </div>
      );
    }
    
    // For regular messages, render with links if it's a string
    return (
      <div className="whitespace-pre-wrap">
        {typeof message === 'string' ? renderMessageWithLinks(message) : message}
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-full overflow-hidden break-words">
      {formatContent()}
    </div>
  );
};

export default ChatMessage;
