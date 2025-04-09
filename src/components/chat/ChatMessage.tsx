
import React, { useState } from 'react';
import { Check, CheckCheck, Clock, Smile } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatMessage as ChatMessageType, supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { formatEventMessage } from './EventMessageFormatter';
import { getInitials } from '@/utils/chatUIUtils';
import { EMOJI_REACTIONS } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  username: string;
  events: Event[];
  avatarUrl?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, username, events, avatarUrl }) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const reactions = message.reactions || [];
      let updated = false;
      
      const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        const users = reactions[existingReactionIndex].users;
        const userIndex = users.indexOf(username);
        
        if (userIndex >= 0) {
          users.splice(userIndex, 1);
          if (users.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          }
        } else {
          users.push(username);
        }
        updated = true;
      } else {
        reactions.push({
          emoji,
          users: [username]
        });
        updated = true;
      }
      
      if (updated) {
        await supabase
          .from('chat_messages')
          .update({ reactions })
          .eq('id', messageId);
      }
      
      setSelectedMessageId(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Fehler beim Hinzufügen der Reaktion",
        description: "Die Reaktion konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    }
  };

  // Parse event data from message if it contains an event
  const renderMessageContent = () => {
    if (message.text.includes('🗓️ **Event:')) {
      const eventTitleMatch = message.text.match(/🗓️ \*\*Event: (.*?)\*\*/);
      const eventTitle = eventTitleMatch ? eventTitleMatch[1] : '';
      
      const eventDateMatch = message.text.match(/Datum: (.*?) um (.*?)(?:\n|$)/);
      const eventDate = eventDateMatch ? eventDateMatch[1] : '';
      const eventTime = eventDateMatch ? eventDateMatch[2] : '';
      
      const eventLocationMatch = message.text.match(/Ort: (.*?)(?:\n|$)/);
      const eventLocation = eventLocationMatch ? eventLocationMatch[1] : '';
      
      const eventCategoryMatch = message.text.match(/Kategorie: (.*?)(?:\n|$)/);
      const eventCategory = eventCategoryMatch ? eventCategoryMatch[1] : '';
      
      const eventData = events.find(event => 
        event.title === eventTitle && 
        event.date === eventDate && 
        event.time === eventTime
      );
      
      const userMessageMatch = message.text.match(/(?:\n\n)([\s\S]*)/);
      const userMessage = userMessageMatch ? userMessageMatch[1] : '';
      
      return formatEventMessage(userMessage, eventData);
    } else {
      return (
        <div className="text-sm whitespace-pre-wrap text-white">{message.text}</div>
      );
    }
  };

  return (
    <div 
      className={`flex items-start gap-2 ${message.sender === username 
        ? "justify-end" 
        : "justify-start"
      }`}
    >
      {message.sender !== username && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.avatar || undefined} alt={message.sender} />
          <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col">
        <div className={`max-w-[280px] p-3 rounded-lg space-y-1 ${
          message.sender === username 
            ? "bg-primary text-white" 
            : message.sender === "System"
              ? "bg-secondary text-white italic"
              : "bg-secondary text-white"
        }`}>
          <div className="flex justify-between items-center">
            <div className="font-medium text-xs">
              {message.sender}
            </div>
            <div className="text-xs opacity-70 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
          
          {renderMessageContent()}
          
          {message.media_url && (
            <div className="mt-2">
              <img 
                src={message.media_url} 
                alt="Shared media" 
                className="rounded-md max-w-full max-h-[200px] object-contain"
              />
            </div>
          )}
        </div>
        
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-2">
            {message.reactions.map((reaction, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`px-1.5 py-0 h-6 text-xs rounded-full ${
                  reaction.users.includes(username) ? 'bg-primary/20' : 'bg-muted'
                }`}
                onClick={() => handleAddReaction(message.id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.users.length}
              </Button>
            ))}
          </div>
        )}
        
        {message.sender === username && (
          <div className="flex justify-end mt-1">
            {message.read_by && message.read_by.length > 1 ? (
              <CheckCheck className="h-3 w-3 text-primary" />
            ) : (
              <Check className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        {message.sender === username && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={username} />
            <AvatarFallback>{getInitials(username)}</AvatarFallback>
          </Avatar>
        )}
        
        <Popover open={selectedMessageId === message.id} onOpenChange={(open) => {
          if (open) setSelectedMessageId(message.id);
          else setSelectedMessageId(null);
        }}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-full mt-1"
            >
              <Smile className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {EMOJI_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="px-1.5 py-0 h-8 text-lg hover:bg-muted"
                  onClick={() => handleAddReaction(message.id, emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ChatMessage;
