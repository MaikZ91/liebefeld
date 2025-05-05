
import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { UserProfile, PrivateMessage } from '@/types/chatTypes';
import { privateMessageService } from '@/services/privateMessageService';
import { getInitials } from '@/utils/chatUIUtils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface PrivateChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  otherUser: UserProfile | null;
}

const PrivateChat: React.FC<PrivateChatProps> = ({
  open,
  onOpenChange,
  currentUser,
  otherUser
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (open && otherUser) {
      fetchMessages();
      markMessagesAsRead();
      setupRealtimeSubscription();
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [open, otherUser]);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const setupRealtimeSubscription = () => {
    if (!otherUser) return;
    
    const channel = supabase
      .channel(`private_messages:${currentUser}_${otherUser.username}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `sender=eq.${otherUser.username},recipient=eq.${currentUser}`
      }, (payload) => {
        console.log('Neue private Nachricht erhalten:', payload);
        const newMessage = payload.new as PrivateMessage;
        setMessages(prev => [...prev, newMessage]);
        markMessagesAsRead();
      })
      .subscribe();
      
    // Speichern Sie den Kanal in einer Referenz
    realtimeChannelRef.current = channel;
  };
  
  const realtimeChannelRef = useRef<any>(null);
  
  const cleanupRealtimeSubscription = () => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  };
  
  const fetchMessages = async () => {
    if (!otherUser) return;
    
    try {
      setLoading(true);
      const fetchedMessages = await privateMessageService.getMessages(
        currentUser,
        otherUser.username
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Fehler beim Abrufen von Nachrichten:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const markMessagesAsRead = async () => {
    if (!otherUser) return;
    
    try {
      await privateMessageService.markAsRead(
        otherUser.username,
        currentUser
      );
    } catch (error) {
      console.error('Fehler beim Markieren von Nachrichten als gelesen:', error);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !otherUser) return;
    
    try {
      const message = await privateMessageService.sendMessage(
        currentUser,
        otherUser.username,
        newMessage.trim()
      );
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: de
      });
    } catch (error) {
      return 'unbekannt';
    }
  };
  
  if (!otherUser) return null;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar || undefined} alt={otherUser.username} />
              <AvatarFallback className="bg-purple-800 text-white">
                {getInitials(otherUser.username)}
              </AvatarFallback>
            </Avatar>
            <SheetTitle className="m-0">{otherUser.username}</SheetTitle>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <p>Noch keine Nachrichten</p>
                <p className="text-sm">Senden Sie die erste Nachricht, um die Konversation zu starten</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender === currentUser;
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isCurrentUser 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs mt-1 opacity-70 text-right">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Schreiben Sie eine Nachricht..."
              className="min-h-[44px] max-h-24 resize-none"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim()}
              className="rounded-full min-w-[40px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PrivateChat;
