
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Input as InputIcon, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useEventContext } from "@/contexts/EventContext";
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase, type ChatMessage as ChatMessageType } from "@/integrations/supabase/client";
import { ChatGroup, TypingUser, USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import { groupFutureEventsByDate } from "@/utils/eventUtils";
import { toast } from '@/hooks/use-toast';

interface ChatGroupProps {
  group: ChatGroup;
  username: string;
  messages: ChatMessageType[];
  typingUsers: TypingUser[];
}

const ChatGroupComponent: React.FC<ChatGroupProps> = ({ 
  group, 
  username, 
  messages, 
  typingUsers 
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  const { events, handleRsvpEvent } = useEventContext();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRsvp = (eventId: string, option: 'yes' | 'no' | 'maybe') => {
    console.log(`Group chat RSVP selection: ${eventId} - ${option}`);
    handleRsvpEvent(eventId, option);
    
    toast({
      title: "RSVP gespeichert",
      description: `Du hast mit "${option}" auf das Event geantwortet.`,
      variant: "default"
    });
  };

  const handleSendMessage = async (eventData?: any) => {
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length && !eventData) || !username || !group.id) return;

    try {
      setIsSending(true);
      
      let mediaUrl = undefined;
      
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${group.id}/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('chat_media')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: urlData } = supabase
          .storage
          .from('chat_media')
          .getPublicUrl(filePath);
          
        mediaUrl = urlData.publicUrl;
      }
      
      let messageText = newMessage;
      if (eventData) {
        const { title, date, time, location, category } = eventData;
        messageText = `🗓️ **Event: ${title}**\nDatum: ${date} um ${time}\nOrt: ${location || 'k.A.'}\nKategorie: ${category}\n\n${newMessage}`;
      }

      const newChatMessage = {
        group_id: group.id,
        sender: username,
        text: messageText,
        avatar: localStorage.getItem(AVATAR_KEY) || '',
        media_url: mediaUrl,
        read_by: [username],
        reactions: []
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(newChatMessage);

      if (error) {
        throw error;
      }

      setNewMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await supabase
        .channel(`typing:${group.id}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar: localStorage.getItem(AVATAR_KEY),
            isTyping: false
          }
        });
        
      setIsEventSelectOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Deine Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (!eventSearchQuery.trim()) return true;
    
    const query = eventSearchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query)) ||
      (event.location && event.location.toLowerCase().includes(query)) ||
      (event.category && event.category.toLowerCase().includes(query)) ||
      (event.date && event.date.toLowerCase().includes(query))
    );
  });
  
  const groupedEvents = groupFutureEventsByDate(filteredEvents);

  const eventSelectContent = (
    <>
      <div className="p-3 bg-muted border-b">
        <h3 className="font-medium mb-2">Event auswählen</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Events suchen..."
            value={eventSearchQuery}
            onChange={(e) => setEventSearchQuery(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
      </div>
      <div className="p-2">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="py-3 px-2 text-center text-muted-foreground text-sm">
            Keine Events gefunden
          </div>
        ) : (
          <div className="space-y-2">
            {Object.keys(groupedEvents).sort().map(dateStr => {
              const date = parseISO(dateStr);
              return (
                <div key={dateStr} className="mb-2">
                  <div className="sticky top-0 bg-primary text-white py-1.5 px-3 text-sm font-semibold rounded-md mb-1.5 shadow-sm">
                    {format(date, 'EEEE, d. MMMM', { locale: de })}
                  </div>
                  <div className="space-y-1 pl-2">
                    {groupedEvents[dateStr].map(event => (
                      <Button
                        key={event.id}
                        variant="ghost"
                        className="w-full justify-start text-left px-2 py-1.5 h-auto"
                        onClick={() => handleSendMessage(event)}
                      >
                        <div>
                          <div className="font-medium line-clamp-1">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.time} • {event.category}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>
          {group.description} • <span className="inline-flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {messages.length > 0 
              ? new Set(messages.map(msg => msg.sender)).size 
              : 0} Mitglieder
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-0">
        <ScrollArea className="h-[400px] rounded-md p-4 mb-4 bg-muted/20">
          <div className="flex flex-col space-y-3">
            {messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                username={username} 
                events={events} 
                avatarUrl={localStorage.getItem(AVATAR_KEY) || undefined}
              />
            ))}
            
            {typingUsers.length > 0 && (
              <div className="flex items-start gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={typingUsers[0].avatar} 
                      alt={typingUsers[0].username} 
                    />
                    <AvatarFallback>
                      {getInitials(typingUsers[0].username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-2 rounded-full text-xs">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter>
        {username ? (
          <MessageInput 
            username={username}
            groupId={group.id}
            handleSendMessage={handleSendMessage}
            isEventSelectOpen={isEventSelectOpen}
            setIsEventSelectOpen={setIsEventSelectOpen}
            eventSelectContent={eventSelectContent}
            isSending={isSending}
          />
        ) : (
          <div className="w-full py-4 text-center">
            <p className="mb-2">Du musst angemeldet sein, um Nachrichten zu schreiben.</p>
            <Button onClick={() => {}}>
              Benutzernamen erstellen
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ChatGroupComponent;
