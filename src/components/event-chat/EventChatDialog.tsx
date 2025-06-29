
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/chatUIUtils';
import { format } from 'date-fns';

interface EventChatMessage {
  id: string;
  sender: string;
  text: string;
  avatar?: string;
  created_at: string;
}

interface EventChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    image_url?: string;
  };
}

const EventChatDialog: React.FC<EventChatDialogProps> = ({ isOpen, onClose, event }) => {
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user info
  const username = localStorage.getItem('currentUsername') || 'Gast';
  const userAvatar = localStorage.getItem('currentUserAvatar') || '';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch event messages
  const fetchEventMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching event messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: `event-${event.id}`,
          sender: username,
          text: newMessage,
          avatar: userAvatar,
          event_id: event.id,
          event_title: event.title,
          event_date: event.date,
          event_location: event.location,
          event_image_url: event.image_url
        }]);

      if (error) throw error;

      setNewMessage('');
      await fetchEventMessages();
      
      toast({
        title: "Nachricht gesendet",
        description: "Deine Nachricht wurde auch in der Ausgehen-Gruppe geteilt.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format time
  const formatTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isOpen) return;

    fetchEventMessages();

    const channel = supabase
      .channel(`event-chat-${event.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `event_id=eq.${event.id}`
      }, () => {
        fetchEventMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, event.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 backdrop-blur-md border-gray-700 text-white max-w-md h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              💬 Event Chat
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Event Info */}
          <div className="bg-gray-800 p-3 rounded-lg mt-2">
            <h4 className="font-medium text-sm mb-1">{event.title}</h4>
            <p className="text-xs text-gray-400">
              📅 {event.date} • 📍 {event.location}
            </p>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>Noch keine Nachrichten.</p>
              <p className="text-xs mt-1">Starte die Unterhaltung!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-2">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={message.avatar} alt={message.sender} />
                  <AvatarFallback className="bg-red-500 text-white text-xs">
                    {getInitials(message.sender)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-sm">{message.sender}</span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm bg-gray-800 p-2 rounded-lg break-words">
                    {message.text}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 border-t border-gray-700 pt-3">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht schreiben..."
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Nachrichten werden auch in der Ausgehen-Gruppe geteilt
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventChatDialog;
