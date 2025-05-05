
import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from '@/utils/chatUIUtils';
import { UserProfile } from '@/types/chatTypes';
import { Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PrivateChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: string;
  otherUser: UserProfile | null;
}

interface PrivateMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  created_at: string;
  read: boolean;
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
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Fetch messages when the chat opens and set up realtime subscription
  useEffect(() => {
    if (!open || !currentUser || !otherUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('private_messages')
          .select('*')
          .or(`sender.eq.${currentUser},recipient.eq.${currentUser}`)
          .or(`sender.eq.${otherUser.username},recipient.eq.${otherUser.username}`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);
        
        // Mark received messages as read
        const unreadMessages = data?.filter(msg => 
          msg.recipient === currentUser && 
          msg.sender === otherUser.username && 
          !msg.read
        ) || [];
        
        if (unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            await supabase
              .from('private_messages')
              .update({ read: true })
              .eq('id', msg.id);
          }
        }
      } catch (error: any) {
        console.error('Error fetching private messages:', error);
        toast({
          title: "Error",
          description: `Could not load messages: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      cleanupRealtimeSubscription();
    };
  }, [open, currentUser, otherUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set up realtime subscription
  const setupRealtimeSubscription = () => {
    if (!currentUser || !otherUser) return;

    try {
      // Create channel for realtime updates
      const channel = supabase
        .channel('private_messages_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `recipient=eq.${currentUser}`
        }, (payload) => {
          if (payload.new && payload.new.sender === otherUser.username) {
            setMessages(prev => [...prev, payload.new as PrivateMessage]);
            
            // Mark as read
            supabase
              .from('private_messages')
              .update({ read: true })
              .eq('id', payload.new.id);
          }
        })
        .subscribe();

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  // Clean up realtime subscription
  const cleanupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !otherUser) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender: currentUser,
          recipient: otherUser.username,
          content: newMessage.trim(),
          read: false
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending private message:', error);
      toast({
        title: "Error",
        description: `Could not send message: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-black text-white border-l border-gray-800" side="right">
        {otherUser && (
          <>
            <SheetHeader className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.avatar} alt={otherUser.username} />
                    <AvatarFallback className="bg-red-500">{getInitials(otherUser.username)}</AvatarFallback>
                  </Avatar>
                  <SheetTitle className="text-white">{otherUser.username}</SheetTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onOpenChange(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Keine Nachrichten. Starte die Konversation!
                </div>
              ) : (
                messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === currentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === currentUser 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-900 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={`text-xs mt-1 ${message.sender === currentUser ? 'text-red-200' : 'text-gray-400'}`}>
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Schreibe eine Nachricht..."
                  className="bg-black border-gray-800 focus:ring-red-500 focus:border-red-500 min-h-[60px] resize-none"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || sending}
                  className="bg-red-500 hover:bg-red-600 self-end"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PrivateChat;
