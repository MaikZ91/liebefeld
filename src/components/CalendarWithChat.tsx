
import React, { useState } from 'react';
import EventCalendar from './EventCalendar';
import GroupChat from './GroupChat';
import { Button } from '@/components/ui/button';
import { useEventContext } from '@/contexts/EventContext';
import { X, MessageSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarWithChatProps {
  defaultView?: "calendar" | "list";
}

const CalendarWithChat = ({ defaultView = "list" }: CalendarWithChatProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'calendar' | 'chat'>('chat');
  const { events } = useEventContext();
  
  return (
    <div className="w-full">
      {/* Desktop Layout - Side by Side */}
      <div className="hidden md:flex gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        {showCalendar ? (
          <div className="w-1/3 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Kalender</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCalendar(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow overflow-hidden border rounded-lg">
              <EventCalendar defaultView={defaultView} />
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setShowCalendar(true)} 
            className="fixed left-4 bottom-20 bg-primary text-white rounded-full shadow-lg"
            size="icon"
          >
            <Calendar className="h-5 w-5" />
          </Button>
        )}
        
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          showCalendar ? "w-2/3" : "w-full"
        )}>
          <div className="mb-2">
            <h2 className="text-lg font-bold">Community Chat</h2>
          </div>
          <div className="h-[calc(100%-2rem)] border rounded-lg overflow-hidden">
            <GroupChat compact={false} />
          </div>
        </div>
      </div>
      
      {/* Mobile Layout - Tabbed - Default to Chat */}
      <div className="md:hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Button
              variant={activeMobileView === 'calendar' ? 'default' : 'outline'} 
              onClick={() => setActiveMobileView('calendar')}
              className="rounded-l-md rounded-r-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Kalender
            </Button>
            <Button
              variant={activeMobileView === 'chat' ? 'default' : 'outline'} 
              onClick={() => setActiveMobileView('chat')}
              className="rounded-r-md rounded-l-none"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>
        </div>
        
        <div className={cn(
          "flex-grow transition-all duration-300",
          activeMobileView === 'calendar' ? 'block' : 'hidden'
        )}>
          <EventCalendar defaultView={defaultView} />
        </div>
        
        <div className={cn(
          "flex-grow transition-all duration-300 overflow-hidden",
          activeMobileView === 'chat' ? 'block' : 'hidden'
        )}>
          <GroupChat compact={false} />
        </div>
      </div>
    </div>
  );
};

export default CalendarWithChat;
