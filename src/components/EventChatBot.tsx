
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Calendar, X, Heart, Loader2, Image, ThumbsUp, Smile, CheckCheck, Check, Share2, Search, HelpCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage, supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateResponse } from '@/utils/chatUtils';
import { useEventContext } from '@/contexts/EventContext';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isToday, isThisWeek, isTomorrow, isThisMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';

type MessageReaction = {
  emoji: string;
  users: string[];
}

type EventPopoverContentProps = {
  events: Event[];
}

const EventPopoverContent: React.FC<EventPopoverContentProps> = ({ events }) => {
  return (
    <div className="grid gap-2 max-h-[300px] overflow-y-auto p-2">
      {events && events.length > 0 ? (
        events.map(event => (
          <div key={event.id} className="flex flex-col bg-muted/50 dark:bg-muted/20 p-2 rounded-md text-sm">
            <div className="font-semibold">{event.title}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(`${event.date}T${event.time}`), 'HH:mm')} Uhr</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{event.location || 'Kein Ort angegeben'}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Keine Events gefunden
        </div>
      )}
    </div>
  );
};

const useChatMessages = (chatGroupId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', chatGroupId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      setMessages(data as ChatMessage[]);
    } catch (err) {
      console.error('Error in fetchMessages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatGroupId) {
      fetchMessages();
      
      // Subscribe to realtime updates
      const subscription = supabase
        .channel('chat_messages_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `group_id=eq.${chatGroupId}`
          },
          (payload) => {
            console.log('Realtime update:', payload);
            fetchMessages();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [chatGroupId]);

  return { messages, loading, refetch: fetchMessages };
};

const EventChatBot = () => {
  const { events } = useEventContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatGroupId, setChatGroupId] = useState<string>('');
  const [userName, setUserName] = useState<string>('Maik');
  const [userAvatar, setUserAvatar] = useState<string>(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}`);
  const { messages, loading, refetch } = useChatMessages(chatGroupId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Setting up a random avatar for this session
    const randomSeed = Math.random().toString(36).substring(7);
    setUserAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
    const storedName = localStorage.getItem('chatUserName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    if (searchInput.trim()) {
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(searchInput.toLowerCase()) || 
        (event.description && event.description.toLowerCase().includes(searchInput.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchInput.toLowerCase())) ||
        (event.organizer && event.organizer.toLowerCase().includes(searchInput.toLowerCase()))
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [searchInput, events]);

  useEffect(() => {
    // Create or fetch the bot chat group when component mounts
    const init = async () => {
      try {
        // First check if we can get any chat group (to verify connection)
        const { data: anyGroup, error: anyGroupError } = await supabase
          .from('chat_groups')
          .select('id')
          .limit(1);
        
        if (anyGroupError) {
          console.error('Error checking chat groups:', anyGroupError);
          return;
        }
        
        // Now check if our specific bot group exists
        const { data: botGroup, error: botGroupError } = await supabase
          .from('chat_groups')
          .select('id')
          .eq('name', 'LiebefeldBot')
          .single();
        
        if (botGroupError && botGroupError.code !== 'PGRST116') {
          console.error('Error fetching bot group:', botGroupError);
          return;
        }
        
        if (botGroup) {
          setChatGroupId(botGroup.id);
        } else {
          // Create a new bot group if it doesn't exist
          const { data: newGroup, error: createError } = await supabase
            .from('chat_groups')
            .insert([
              { 
                name: 'LiebefeldBot',
                description: 'Chat mit dem LiebefeldBot'
              }
            ])
            .select('id')
            .single();
          
          if (createError) {
            console.error('Error creating bot group:', createError);
            return;
          }
          
          if (newGroup) {
            setChatGroupId(newGroup.id);
          }
        }
      } catch (err) {
        console.error('Error in chat group initialization:', err);
      }
    };
    
    init();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages come in
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !fileInputRef.current?.files?.length) || !chatGroupId) return;

    const trimmedInput = input.trim();
    
    // Handle file upload if present
    let mediaUrl = null;
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      try {
        const { data, error } = await supabase.storage
          .from('chat_media')
          .upload(`${uuidv4()}-${file.name}`, file);
        
        if (error) {
          toast({
            title: "Fehler beim Hochladen",
            description: "Das Bild konnte nicht hochgeladen werden.",
            variant: "destructive"
          });
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat_media')
          .getPublicUrl(data.path);
        
        mediaUrl = publicUrl;
      } catch (error) {
        console.error('File upload error:', error);
        return;
      }
    }
    
    // Send user message
    try {
      await supabase.from('chat_messages').insert([
        {
          group_id: chatGroupId,
          sender: userName,
          text: trimmedInput,
          avatar: userAvatar,
          media_url: mediaUrl,
          read_by: [userName],
          reactions: []
        }
      ]);
      
      setInput('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show typing indicator
      setIsTyping(true);
      
      // Give some time for the UI to update
      setTimeout(async () => {
        try {
          // Generate bot response
          let responseText = '';
          
          if (events && Array.isArray(events)) {
            responseText = generateResponse(trimmedInput, events);
          } else {
            responseText = "Ich kann derzeit keine Eventdaten laden. Bitte versuche es später erneut.";
            console.error("Events array is not available:", events);
          }
          
          // Send bot response
          await supabase.from('chat_messages').insert([
            {
              group_id: chatGroupId,
              sender: 'LiebefeldBot',
              text: responseText,
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot',
              read_by: [userName]
            }
          ]);
          
        } catch (error) {
          console.error('Error generating or sending bot response:', error);
          
          // Send fallback response on error
          await supabase.from('chat_messages').insert([
            {
              group_id: chatGroupId,
              sender: 'LiebefeldBot',
              text: "Entschuldigung, ich habe technische Schwierigkeiten. Versuche es später noch einmal.",
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot',
              read_by: [userName]
            }
          ]);
        } finally {
          setIsTyping(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Deine Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      // Get the current message to update its reactions
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (messageError) {
        console.error('Error fetching message for reaction:', messageError);
        return;
      }
      
      // Fix for the array iteration issue
      let updatedReactions = Array.isArray(messageData.reactions) 
        ? [...messageData.reactions] 
        : [];
      
      const existingReactionIndex = updatedReactions.findIndex(r => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // Toggle user from existing reaction
        const reaction = updatedReactions[existingReactionIndex];
        if (reaction.users.includes(userName)) {
          reaction.users = reaction.users.filter(u => u !== userName);
          if (reaction.users.length === 0) {
            // Remove reaction if no users left
            updatedReactions = updatedReactions.filter(r => r.emoji !== emoji);
          }
        } else {
          reaction.users.push(userName);
        }
      } else {
        // Add new reaction
        updatedReactions.push({
          emoji,
          users: [userName]
        });
      }
      
      // Update the message with new reactions
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);
      
      if (updateError) {
        console.error('Error updating reactions:', updateError);
      }
      
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    return msgs.reduce((groups, message) => {
      try {
        const date = message.created_at ? new Date(message.created_at) : new Date();
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        
        groups[dateStr].push(message);
        return groups;
      } catch (error) {
        console.error('Error grouping message by date:', error, message);
        return groups;
      }
    }, {} as Record<string, ChatMessage[]>);
  };
  
  const formatDateHeader = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) {
        return 'Heute';
      } else if (isTomorrow(date)) {
        return 'Morgen';
      } else if (isThisWeek(date)) {
        return format(date, 'EEEE', { locale: de });
      } else if (isThisMonth(date)) {
        return format(date, 'dd. MMMM', { locale: de });
      } else {
        return format(date, 'dd. MMMM yyyy', { locale: de });
      }
    } catch (error) {
      console.error('Error formatting date header:', error, dateStr);
      return 'Unbekanntes Datum';
    }
  };

  const messageGroups = messages && messages.length > 0 ? groupMessagesByDate(messages) : {};

  // Render HTML content safely
  const renderHtmlContent = (html: string) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const toggleEventDetails = (event: Event) => {
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-5 right-5 h-12 w-12 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-lg"
            size="icon"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-900 text-white border-gray-800 rounded-lg">
          <DialogTitle className="sr-only">Chat mit dem LiebefeldBot</DialogTitle>
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-red-800 to-red-700">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot" />
                  <AvatarFallback>LB</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">LiebefeldBot</h3>
                  <p className="text-xs text-gray-300">Event-Assistent</p>
                </div>
              </div>
              <div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white hover:bg-red-600/20"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-20 w-[300px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                Object.keys(messageGroups).map((dateStr) => (
                  <div key={dateStr} className="space-y-4">
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-xs bg-gray-800/50 text-gray-300">
                        {formatDateHeader(dateStr)}
                      </Badge>
                    </div>
                    
                    {messageGroups[dateStr].map((message) => (
                      <div key={message.id} className={`flex ${message.sender === userName ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[80%] ${message.sender === userName ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.avatar} />
                            <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className={`space-y-1 ${message.sender === userName ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-400">
                                {message.sender}
                              </span>
                              <span className="text-xs text-gray-500">
                                {message.created_at && format(new Date(message.created_at), 'HH:mm')}
                              </span>
                              {message.read_by && message.read_by.length > 1 && (
                                <span className="text-xs text-blue-400">
                                  <CheckCheck className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            
                            <div className={`px-4 py-2 rounded-lg ${
                              message.sender === userName 
                                ? 'bg-red-700 text-white'
                                : 'bg-gray-800 text-white'
                            }`}>
                              {message.media_url && (
                                <img 
                                  src={message.media_url} 
                                  alt="Shared media" 
                                  className="mb-2 max-w-full rounded"
                                  onError={(e) => { e.currentTarget.style.display = 'none' }} 
                                />
                              )}
                              
                              {message.text.startsWith('<div') 
                                ? renderHtmlContent(message.text)
                                : <p>{message.text}</p>
                              }
                              
                              {message.sender === 'LiebefeldBot' && message.text.includes('event-details-id=') && (
                                <div className="mt-2">
                                  {events.filter(event => message.text.includes(`event-details-id=${event.id}`)).map(event => (
                                    <div 
                                      key={event.id}
                                      className="p-2 border border-gray-700 rounded bg-gray-800/50 cursor-pointer hover:bg-gray-700/50 transition-colors mt-2"
                                      onClick={() => toggleEventDetails(event)}
                                    >
                                      <h4 className="font-medium">{event.title}</h4>
                                      <div className="flex text-xs text-gray-400 gap-4 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{format(new Date(event.date), 'dd.MM.yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          <span>{event.time.substring(0, 5)} Uhr</span>
                                        </div>
                                      </div>
                                      
                                      {selectedEvent?.id === event.id && (
                                        <div className="mt-2 text-sm animate-fade-in">
                                          {event.description && (
                                            <p className="text-gray-300 mb-2">{event.description}</p>
                                          )}
                                          {event.location && (
                                            <div className="flex items-center gap-1 text-gray-400">
                                              <MapPin className="h-3 w-3" />
                                              <span>{event.location}</span>
                                            </div>
                                          )}
                                          {event.organizer && (
                                            <div className="text-gray-400 mt-1">
                                              <span className="text-xs">Veranstalter: {event.organizer}</span>
                                            </div>
                                          )}
                                          <div className="flex gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                              {event.category || 'Sonstiges'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                                              <span>{event.likes || 0}</span>
                                            </Badge>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {message.reactions && message.reactions.length > 0 && (
                              <div className={`flex gap-1 ${message.sender === userName ? 'justify-end' : 'justify-start'}`}>
                                {message.reactions.map((reaction, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline" 
                                    className={`text-xs py-0 h-5 ${
                                      reaction.users.includes(userName) 
                                        ? 'bg-gray-700'
                                        : 'bg-transparent'
                                    }`}
                                    onClick={() => addReaction(message.id, reaction.emoji)}
                                  >
                                    {reaction.emoji} {reaction.users.length}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {message.sender !== 'System' && (
                              <div className={`flex gap-1 opacity-0 hover:opacity-100 transition-opacity ${message.sender === userName ? 'justify-end' : 'justify-start'}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-gray-800"
                                  onClick={() => addReaction(message.id, '👍')}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-gray-800"
                                  onClick={() => addReaction(message.id, '❤️')}
                                >
                                  <Heart className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-gray-800"
                                  onClick={() => addReaction(message.id, '😂')}
                                >
                                  <Smile className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot" />
                      <AvatarFallback>LB</AvatarFallback>
                    </Avatar>
                    
                    <div className="px-4 py-2 rounded-lg bg-gray-800 text-white flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Schreibt...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-800 flex gap-2 items-center">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                onClick={handleImageUpload}
              >
                <Image className="h-5 w-5" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-gray-900 border-gray-800 text-white">
                  <div className="p-2">
                    <Input
                      placeholder="Events suchen..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="max-h-60 overflow-y-auto p-2">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                          <div 
                            key={event.id}
                            className="flex flex-col p-2 hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => {
                              setInput(`Erzähl mir mehr über "${event.title}"`);
                              setSearchInput('');
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(event.date), 'dd.MM.yyyy')}</span>
                              <span>·</span>
                              <Clock className="h-3 w-3" />
                              <span>{event.time.substring(0, 5)} Uhr</span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Keine Events gefunden
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={() => {
                  if (fileInputRef.current?.files?.length) {
                    handleSend();
                  }
                }}
              />
              
              <Input
                type="text"
                placeholder="Schreibe eine Nachricht..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              
              <Button
                onClick={() => handleSend()}
                size="icon"
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-md"
                disabled={!input.trim() && !fileInputRef.current?.files?.length}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventChatBot;
