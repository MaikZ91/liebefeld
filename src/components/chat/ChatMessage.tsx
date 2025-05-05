
import React, { useState } from 'react';
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
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isConsecutive = false, 
  isGroup = false,
  eventData,
  onDateSelect
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Format message content - extract event data if present
  const formatContent = () => {
    if (eventData) {
      return <EventMessageFormatter event={eventData} />;
    }
    
    // Check if message contains a date selection prompt
    const hasDatePrompt = message.toLowerCase().includes('events gibt es heute') || 
                          message.toLowerCase().includes('events für heute');
    
    if (hasDatePrompt && onDateSelect) {
      return (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap">{message}</div>
          
          <div className="flex items-center gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700 flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{date ? format(date, "yyyy-MM-dd") : "Datum wählen"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      onDateSelect(format(newDate, "yyyy-MM-dd"));
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto bg-gray-900 text-white")}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="default" 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (date) {
                  onDateSelect(format(date, "yyyy-MM-dd"));
                }
              }}
            >
              Für dieses Datum suchen
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
        isGroup ? 'bg-[#222632] text-white' : 'bg-gray-800 text-white'
      } shadow-md w-full max-w-full overflow-hidden break-words`}
    >
      <div className="w-full max-w-full overflow-hidden break-words">
        {formatContent()}
      </div>
    </div>
  );
};

export default ChatMessage;
