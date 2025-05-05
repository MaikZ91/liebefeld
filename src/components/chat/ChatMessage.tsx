
import React, { useState, useEffect } from 'react';
import { EventShare } from '@/types/chatTypes';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventMessageFormatter from './EventMessageFormatter';

interface ChatMessageProps {
  message: string;
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
    if (!message) return false;
    
    const lowerMessage = message.toLowerCase();
    const dateKeywords = [
      'wann', 'heute', 'morgen', 'datum', 'kalender', 'tag', 'monat',
      'events', 'veranstaltungen', 'konzerte', 'party', 'festival',
      'events gibt es', 'events am', 'events für', 'veranstaltungen am',
      'welche', 'was gibt', 'was ist los', 'was läuft', 'was passiert'
    ];
    
    return dateKeywords.some(keyword => lowerMessage.includes(keyword)) || showDateSelector;
  };
  
  // Format message content - extract event data if present
  const formatContent = () => {
    if (eventData) {
      return <EventMessageFormatter event={eventData} />;
    }
    
    const hasDatePrompt = detectCalendarRequest();
    
    if (hasDatePrompt && onDateSelect) {
      return (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap">{message}</div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-black hover:bg-gray-900 border-gray-800 flex items-center gap-2 w-full sm:w-auto"
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
                  className={cn("p-3 pointer-events-auto bg-black text-white")}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="default" 
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
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
    
    return <div className="whitespace-pre-wrap">{message}</div>;
  };
  
  return (
    <div 
      className={`p-3 rounded-lg ${isConsecutive ? 'mt-1' : 'mt-2'} ${
        isGroup ? 'bg-black text-white' : 'bg-black text-white'
      } shadow-md w-full max-w-full overflow-hidden break-words`}
    >
      <div className="w-full max-w-full overflow-hidden break-words">
        {formatContent()}
      </div>
    </div>
  );
};

export default ChatMessage;
