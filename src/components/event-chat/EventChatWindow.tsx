import React, { useState, useEffect } from 'react';
import { X, Send, Heart, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatService } from '@/services/chatService';
import { USERNAME_KEY } from '@/types/chatTypes';
import { Badge } from '@/components/ui/badge';

interface EventChatWindowProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  avatar?: string;
  created_at: string;
}

const EventChatWindow: React.FC<EventChatWindowProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  
  const currentUsername = localStorage.getItem(USERNAME_KEY) || 'Gast';
  const groupId = `event-${eventId}`;

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // Subscribe to real-time updates
      const subscription = chatService.createMessageSubscription(
        groupId,
        (newMessage) => {
          setMessages(prev => [...prev, {
            id: newMessage.id,
            text: newMessage.text,
            sender: newMessage.user_name,
            avatar: newMessage.user_avatar,
            created_at: newMessage.created_at
          }]);
        },
        () => loadMessages(),
        currentUsername
      );

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [isOpen, groupId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const fetchedMessages = await chatService.getMessages(groupId);
      setMessages(fetchedMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        avatar: msg.avatar,
        created_at: msg.created_at
      })));
      
      // Count unique users in this chat
      const uniqueUsers = new Set(fetchedMessages.map(msg => msg.sender));
      setUserCount(uniqueUsers.size);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      await chatService.sendMessage(groupId, inputValue, currentUsername);
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] bg-background border-border flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{eventTitle}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Users className="h-4 w-4 mr-1" />
                <span>{userCount} Teilnehmer</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Event Chat startet!</h3>
                  <p className="text-sm text-muted-foreground">
                    Sei der Erste, der eine Nachricht schreibt
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.avatar || undefined} />
                      <AvatarFallback>{message.sender[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{message.sender}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="border-t p-6">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Nachricht an ${eventTitle}...`}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventChatWindow;