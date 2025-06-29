
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { format } from 'date-fns';

interface EventMessage {
  id: string;
  sender: string;
  text: string;
  avatar?: string;
  created_at: string;
}

interface EventMessageCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    image_url?: string;
  };
  messages: EventMessage[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onOpenFullChat: () => void;
}

const EventMessageCard: React.FC<EventMessageCardProps> = ({
  event,
  messages,
  isExpanded,
  onToggleExpanded,
  onOpenFullChat
}) => {
  const formatTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch {
      return '';
    }
  };

  const recentMessages = messages.slice(-3);

  return (
    <Card className="bg-gray-900 border-gray-700 text-white mb-3">
      {/* Event Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {event.image_url && (
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{event.title}</h4>
            <p className="text-xs text-gray-400">
              📅 {event.date} • 📍 {event.location}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFullChat}
              className="text-red-400 hover:text-red-300 hover:bg-gray-800"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Preview */}
      {isExpanded && (
        <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">
              Noch keine Nachrichten zu diesem Event
            </p>
          ) : (
            <>
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-2">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={message.avatar} alt={message.sender} />
                    <AvatarFallback className="bg-red-500 text-white text-xs">
                      {getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{message.sender}</span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 truncate">
                      {message.text}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenFullChat}
                  className="w-full text-xs text-red-400 hover:text-red-300"
                >
                  Alle {messages.length} Nachrichten anzeigen
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default EventMessageCard;
