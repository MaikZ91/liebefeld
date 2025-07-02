
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bot, Users, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageList from './MessageList';
import GroupChat from '../GroupChat';
import EventList from './EventList';
import { useChatLogic } from './useChatLogic';
import { EventChatBotProps } from './types';

interface FullPageChatBotProps extends EventChatBotProps {
  chatLogic: ReturnType<typeof useChatLogic>;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  hideInput?: boolean;
  externalInput?: string;
  setExternalInput?: (input: string) => void;
  onExternalSendHandlerChange?: (handler: (() => void) | null) => void;
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent,
  activeCategory,
  onCategoryChange,
  hideInput = false,
  externalInput,
  setExternalInput,
  onExternalSendHandlerChange
}) => {
  const [showEventList, setShowEventList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogic.messages]);

  const categories = [
    'Ausgehen', 'Sport', 'Kultur', 'Essen', 'Networking', 
    'Outdoor', 'Shopping', 'Wellness', 'Bildung', 'Familie'
  ];

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-900 rounded-full p-1">
              <Button
                variant={activeChatModeValue === 'ai' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full px-4 py-1 text-xs transition-all duration-200",
                  activeChatModeValue === 'ai' 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Bot className="w-3 h-3 mr-1" />
                AI Assistent
              </Button>
              <Button
                variant={activeChatModeValue === 'community' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-full px-4 py-1 text-xs transition-all duration-200",
                  activeChatModeValue === 'community' 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Users className="w-3 h-3 mr-1" />
                Community
                <Badge className="ml-1 bg-green-600 text-white text-[8px] px-1">
                  6
                </Badge>
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEventList(!showEventList)}
            className="text-gray-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Pills */}
        {activeChatModeValue === 'community' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs transition-all duration-200",
                  activeCategory === category
                    ? "bg-red-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Content - Fixed padding to account for bottom navigation */}
      <div className="flex-1 overflow-hidden pb-20"> {/* Added pb-20 for bottom navigation space */}
        {activeChatModeValue === 'ai' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <MessageList 
                messages={chatLogic.messages}
                isTyping={chatLogic.isTyping}
                onAddEvent={onAddEvent}
              />
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className="h-full">
            <GroupChat 
              groupId={communityGroupId}
              groupName={`${activeCategory} in Bielefeld`}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Event List Overlay */}
      {showEventList && (
        <div className="absolute inset-0 bg-black bg-opacity-90 z-50">
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Heutige Events</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEventList(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
            <EventList onAddEvent={onAddEvent} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FullPageChatBot;
