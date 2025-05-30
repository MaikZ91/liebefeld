
import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Paperclip, Calendar, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { useEventContext } from '@/contexts/EventContext';
import { messageService } from '@/services/messageService';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/chatUIUtils';
import { useChatMessages } from '@/hooks/chat/useChatMessages';

interface ChatGroupProps {
  groupId: string;
  groupName: string;
  onOpenUserDirectory?: () => void;
}

const ChatGroup: React.FC<ChatGroupProps> = ({ 
  groupId, 
  groupName, 
  onOpenUserDirectory 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { events } = useEventContext();
  
  // Use the simplified chat messages hook
  const {
    messages,
    loading,
    error,
    typingUsers,
    isReconnecting,
    handleReconnect,
    chatBottomRef,
    chatContainerRef
  } = useChatMessages(groupId, username);
  
  // Update username when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newUsername = localStorage.getItem(USERNAME_KEY) || 'Gast';
      const newAvatar = localStorage.getItem(AVATAR_KEY);
      setUsername(newUsername);
      setAvatar(newAvatar);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Format time for display
  const formatTime = (isoDateString: string): string => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 3600));
    const diffInDays = Math.floor(diff / (1000 * 3600 * 24));

    if (diffInMinutes < 1) {
      return 'jetzt';
    } else if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Minuten`;
    } else if (diffInHours < 24) {
      return `vor ${diffInHours} Stunden`;
    } else if (diffInDays === 1) {
      return 'gestern';
    } else if (diffInDays < 7) {
      return `vor ${diffInDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };
  
  // Handle sending messages - simplified
  const handleSubmit = async (e?: React.FormEvent, eventData?: any) => {
    if (e) {
      e.preventDefault();
    }
    
    if ((!newMessage.trim() && !eventData) || !username || !groupId) {
      return;
    }
    
    try {
      setIsSending(true);
      
      // Format message with event data if present
      let messageText = newMessage.trim();
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageText = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${messageText}`;
      }
      
      // Clear input immediately for better UX
      setNewMessage('');
      
      // Send message to database - that's it! No optimistic updates
      const messageId = await messageService.sendMessage(
        groupId,
        username,
        messageText,
        avatar
      );
      
      if (!messageId) {
        throw new Error('Failed to send message');
      }
      
      console.log('Message sent successfully to database:', messageId);
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message text on error
      setNewMessage(messageText || newMessage);
      toast({
        title: "Fehler beim Senden",
        description: "Die Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle typing - simplified
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Simple typing indicator without complex state management
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 2000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Filter events for sharing
  const filteredEvents = events.filter(event => {
    if (!eventSearchQuery) return true;
    
    const query = eventSearchQuery.toLowerCase();
    return (
      event.title?.toLowerCase().includes(query) || 
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.category?.toLowerCase().includes(query)
    );
  });
  
  const handleShareEvent = (event: any) => {
    const eventData = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category
    };
    
    setIsEventSelectOpen(false);
    handleSubmit(undefined, eventData);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mr-3">
              <span className="text-white font-bold">{groupName.slice(0, 1).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{groupName}</h3>
              <p className="text-sm text-gray-400">{messages.length} Nachrichten</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenUserDirectory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full p-0 px-2 text-red-300 hover:text-red-200 hover:bg-red-900/20"
                onClick={onOpenUserDirectory}
              >
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">Benutzer</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-black">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-red-500 rounded-full"></div>
            </div>
          )}
          
          {error && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={handleReconnect}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reconnect
                </Button>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="flex flex-col space-y-4">
              {messages.map((message, index) => {
                const isConsecutive = index > 0 && messages[index - 1].user_name === message.user_name;
                const timeAgo = formatTime(message.created_at);
                
                return (
                  <div key={message.id} className="w-full">
                    {!isConsecutive && (
                      <div className="flex items-center mb-1">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={message.user_avatar} alt={message.user_name} />
                          <AvatarFallback className="bg-red-500">{getInitials(message.user_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-white">{message.user_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{timeAgo}</span>
                      </div>
                    )}
                    <div className={`ml-10 pl-2 border-l-2 border-red-500 ${isConsecutive ? 'mt-1' : 'mt-0'}`}>
                      <div className="bg-black rounded-md p-2 text-white break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.length > 0 && (
                <div className="ml-10 pl-2">
                  <div className="text-gray-400 text-sm flex items-center">
                    {typingUsers.length === 1 ? (
                      <>{typingUsers[0].username} schreibt...</>
                    ) : (
                      <>{typingUsers.length} Personen schreiben...</>
                    )}
                    <div className="flex ml-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatBottomRef}></div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-3 bg-black border-t border-gray-800">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 bg-black rounded-lg relative border border-gray-800">
              <Textarea
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                placeholder="Schreibe eine Nachricht..."
                className="min-h-[44px] max-h-24 resize-none bg-black border-gray-800 focus:ring-red-500 focus:border-red-500 placeholder-gray-500 text-white pr-12"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Popover open={isEventSelectOpen} onOpenChange={setIsEventSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 max-h-[400px]" side="top">
                    <div className="p-2 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-gray-400" />
                        <Input
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          placeholder="Event suchen..."
                          className="bg-black border-gray-800"
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <div className="p-2 space-y-2">
                        {filteredEvents.length === 0 ? (
                          <p className="text-gray-400 text-center py-4">Keine Events gefunden</p>
                        ) : (
                          filteredEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className="p-2 bg-black rounded-md hover:bg-gray-900 cursor-pointer border border-gray-800"
                              onClick={() => handleShareEvent(event)}
                            >
                              <p className="font-medium text-white">{event.title}</p>
                              <p className="text-sm text-gray-400">
                                {event.date} um {event.time} • {event.category}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isSending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg h-10 px-4"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatGroup;
