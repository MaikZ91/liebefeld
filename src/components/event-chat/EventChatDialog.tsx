
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EventMessage {
  id: string;
  sender: string;
  text: string;
  avatar?: string;
  created_at: string;
}

interface EventChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event?: {
    id: string;
    title: string;
    date: string;
    location: string;
    image_url?: string;
  };
}

const EventChatDialog: React.FC<EventChatDialogProps> = ({ isOpen, onClose, event }) => {
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user from localStorage
  const currentUsername = localStorage.getItem('currentUsername') || 'Gast';
  const currentAvatar = localStorage.getItem('currentAvatar') || '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png';

  // Fetch messages for this event
  const fetchMessages = async () => {
    if (!event?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, sender, text, avatar, created_at')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching event messages:', error);
      toast({
        title: "Fehler",
        description: "Chat-Nachrichten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !event?.id || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: `event-${event.id}`, // Event-specific group
          sender: currentUsername,
          text: newMessage,
          avatar: currentAvatar,
          event_id: event.id,
          event_title: event.title,
          event_date: event.date,
          event_location: event.location,
          event_image_url: event.image_url
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // Refresh messages
      
      toast({
        title: "Nachricht gesendet",
        description: "Deine Nachricht wurde erfolgreich gesendet.",
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
      setIsSending(false);
    }
  };

  // Load messages when dialog opens
  useEffect(() => {
    if (isOpen && event?.id) {
      fetchMessages();
    }
  }, [isOpen, event?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if no event
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 backdrop-blur-md border-gray-700 text-white max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <div className="font-bold text-sm">{event.title}</div>
              <div className="text-xs text-gray-400">{event.date} • {event.location}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Lade Nachrichten...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <span className="text-4xl mb-2 block">💬</span>
              <p>Noch keine Nachrichten.</p>
              <p className="text-sm">Sei der Erste, der etwas schreibt!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={`flex items-start gap-3 ${
                  message.sender === currentUsername ? 'flex-row-reverse' : ''
                }`}>
                  <img 
                    src={message.avatar || '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png'} 
                    alt={message.sender}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className={`flex flex-col ${
                    message.sender === currentUsername ? 'items-end' : 'items-start'
                  }`}>
                    <div className="text-xs text-gray-400 mb-1">{message.sender}</div>
                    <div className={`max-w-xs p-3 rounded-lg break-words ${
                      message.sender === currentUsername 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-700 text-white'
                    }`}>
                      {message.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Schreibe eine Nachricht..."
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventChatDialog;
