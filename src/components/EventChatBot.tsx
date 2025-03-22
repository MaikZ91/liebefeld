import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Calendar, X, Heart, Loader2, Image, ThumbsUp, Smile, CheckCheck, Check, Share2, Search, HelpCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { type Event, RsvpOption, normalizeRsvpCounts } from '@/types/eventTypes';
import { useEventContext } from '@/contexts/EventContext';
import { generateResponse, getWelcomeMessage } from '@/utils/chatUtils';
import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase, type ChatMessage, type MessageReaction } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const USERNAME_KEY = "community_chat_username";
const AVATAR_KEY = "community_chat_avatar";
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  reactions?: MessageReaction[];
  read_by?: string[];
  media_url?: string;
  eventData?: Event;
}

const EventChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [quickInput, setQuickInput] = useState('');
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || "Gast");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  
  const { events, handleRsvpEvent } = useEventContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log(`EventChatBot received ${events.length} events from context`);
    if (events.length > 0) {
      console.log("Sample events from context:", events.slice(0, 3));
    }
  }, [events]);

  const handleSend = (text = input, sharedEvent?: Event) => {
    const messageText = text.trim();
    if (!messageText && !fileInputRef.current?.files?.length && !sharedEvent) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      read_by: [username],
      eventData: sharedEvent
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setQuickInput('');
    setIsTyping(true);
    setIsOpen(true);
    setSelectedEventId(null);

    let mediaUrl: string | undefined = undefined;
    const processMessage = async () => {
      try {
        if (fileInputRef.current?.files?.length) {
          const file = fileInputRef.current.files[0];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `event_chat/${fileName}`;
          
          const { data: buckets } = await supabase.storage.listBuckets();
          if (!buckets?.find(b => b.name === 'chat_media')) {
            await supabase.storage.createBucket('chat_media', { public: true });
          }
          
          const { error: uploadError } = await supabase
            .storage
            .from('chat_media')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            toast({
              title: "Fehler beim Hochladen",
              description: "Die Datei konnte nicht hochgeladen werden.",
              variant: "destructive"
            });
          } else {
            const { data: urlData } = supabase
              .storage
              .from('chat_media')
              .getPublicUrl(filePath);
              
            mediaUrl = urlData.publicUrl;
            
            setMessages(prev => prev.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, media_url: mediaUrl } 
                : msg
            ));
          }
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } catch (error) {
        console.error("Error processing file:", error);
      }
    };
    
    const storeUserMessage = async () => {
      try {
        await processMessage();
        
        const { data: groupsCheck } = await supabase
          .from('chat_groups')
          .select('id')
          .limit(1);
          
        if (groupsCheck && groupsCheck.length > 0) {
          const botGroupName = "LiebefeldBot";
          const { data: botGroup } = await supabase
            .from('chat_groups')
            .select('id')
            .eq('name', botGroupName)
            .single();
            
          let botGroupId;
          
          if (!botGroup) {
            const { data: newGroup } = await supabase
              .from('chat_groups')
              .insert({
                name: botGroupName,
                description: "Frag den Bot nach Events in Liebefeld",
                created_by: "System"
              })
              .select()
              .single();
              
            botGroupId = newGroup?.id;
          } else {
            botGroupId = botGroup.id;
          }
          
          if (botGroupId) {
            const eventText = `🗓️ **Event: ${sharedEvent.title}**\nDatum: ${sharedEvent.date} um ${sharedEvent.time}\nOrt: ${sharedEvent.location || 'k.A.'}\nKategorie: ${sharedEvent.category}\n\n${messageText}`;
            
            await supabase
              .from('chat_messages')
              .insert({
                group_id: botGroupId,
                sender: username,
                text: eventText,
                avatar: localStorage.getItem(AVATAR_KEY),
                media_url: mediaUrl,
                read_by: [username],
                reactions: []
              });
          }
        }
      } catch (error) {
        console.error("Error storing user message:", error);
      }
    };
    
    storeUserMessage();

    setTimeout(() => {
      let botResponse = '';
      if (sharedEvent) {
        botResponse = `Danke für das Teilen des Events "${sharedEvent.title}"! Das klingt spannend. Möchtest du mehr Details dazu wissen oder soll ich ähnliche Events in ${sharedEvent.location || 'der Umgebung'} vorschlagen?`;
      } else {
        botResponse = generateResponse(messageText, events);
      }
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
        read_by: [username]
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      const storeBotResponse = async () => {
        try {
          const { data: groupsCheck } = await supabase
            .from('chat_groups')
            .select('id')
            .limit(1);
            
          if (groupsCheck && groupsCheck.length > 0) {
            const botGroupName = "LiebefeldBot";
            const { data: botGroup } = await supabase
              .from('chat_groups')
              .select('id')
              .eq('name', botGroupName)
              .single();
              
            if (botGroup) {
              await supabase
                .from('chat_messages')
                .insert({
                  group_id: botGroup.id,
                  sender: "LiebefeldBot",
                  text: botResponse,
                  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot",
                  read_by: [username]
                });
            }
          }
        } catch (error) {
          console.error("Error storing bot response:", error);
        }
      };
      
      storeBotResponse();
    }, 700);
  };

  const handleQuickSend = () => {
    if (!quickInput.trim()) return;
    handleSend(quickInput);
  };
  
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex < 0) return;
      
      const message = messages[messageIndex];
      
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
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
          ...message,
          reactions
        };
        setMessages(updatedMessages);
        
        const { data: groupsCheck } = await supabase
          .from('chat_groups')
          .select('id')
          .limit(1);
          
        if (groupsCheck && groupsCheck.length > 0) {
          const realMessageId = messageId.startsWith('user-') || messageId.startsWith('bot-') 
            ? null 
            : messageId;
            
          if (realMessageId) {
            await supabase
              .from('chat_messages')
              .update({ reactions })
              .eq('id', realMessageId);
          }
        }
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
  
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleShareEvent = () => {
    console.log("Opening event selection dropdown");
    setIsEventSelectOpen(prev => !prev);
    setEventSearchQuery('');
  };

  const handleEventSelect = (eventId: string) => {
    console.log("Event selected:", eventId);
    const selectedEvent = events.find(event => event.id === eventId);
    if (selectedEvent) {
      handleSend(`Ich möchte dieses Event teilen: ${selectedEvent.title}`, selectedEvent);
      setIsEventSelectOpen(false);
    }
  };

  const handleRsvp = (eventId: string, option: RsvpOption) => {
    console.log(`Chat RSVP selection: ${eventId} - ${option}`);
    handleRsvpEvent(eventId, option);
    
    toast({
      title: "RSVP gespeichert",
      description: option === 'yes' ? "Du hast zugesagt!" : 
                   option === 'no' ? "Du hast abgesagt." : 
                   "Du kommst vielleicht.",
      variant: "default"
    });
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

  const EventCard = ({ event }: { event: Event }) => {
    const rsvpCounts = normalizeRsvpCounts(event);
    const totalRsvp = rsvpCounts.yes + rsvpCounts.no + rsvpCounts.maybe;

    return (
      <div className="mt-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-red-500" />
          <span className="font-medium text-white">{event.title}</span>
        </div>
        
        <div className="text-xs text-gray-300 space-y-1.5">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1.5" />
            <span>{event.date} um {event.time}</span>
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1.5" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Heart className="h-3 w-3 mr-1.5" />
            <span>{event.category}</span>
            {event.likes && event.likes > 0 && (
              <span className="ml-2 flex items-center">
                • <Heart className="h-3 w-3 mx-1 fill-red-500 text-red-500" /> {event.likes}
              </span>
            )}
          </div>
          
          {totalRsvp > 0 && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700/50">
              <div className="flex items-center text-white gap-1" title="Zusagen">
                <Check className="h-3.5 w-3.5 text-green-500" /> 
                <span className="font-medium">{rsvpCounts.yes}</span>
              </div>
              <div className="flex items-center text-white gap-1" title="Vielleicht">
                <HelpCircle className="h-3.5 w-3.5 text-yellow-500" /> 
                <span className="font-medium">{rsvpCounts.maybe}</span>
              </div>
              <div className="flex items-center text-white gap-1" title="Absagen">
                <X className="h-3.5 w-3.5 text-red-500" /> 
                <span className="font-medium">{rsvpCounts.no}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 bg-green-500/20 hover:bg-green-500/30 border-green-500/30 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleRsvp(event.id, 'yes');
              }}
            >
              <Check className="h-3 w-3 mr-1.5" /> Zusagen
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleRsvp(event.id, 'maybe');
              }}
            >
              <HelpCircle className="h-3 w-3 mr-1.5" /> Vielleicht
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 bg-red-500/20 hover:bg-red-500/30 border-red-500/30 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleRsvp(event.id, 'no');
              }}
            >
              <X className="h-3 w-3 mr-1.5" /> Absagen
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              className="fixed left-4 bottom-8 rounded-full w-14 h-14 shadow-lg bg-gradient-to-tr from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 flex items-center justify-center animate-pulse-soft ring-4 ring-red-300 dark:ring-red-900/40 z-50"
              aria-label="Event Chat"
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="right" 
            className="bg-gradient-to-br from-[#1A1D2D] to-[#131722] border-red-900/30 p-2 mb-2 shadow-lg w-72 animate-fade-in"
          >
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Frag mich nach Events..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickSend()}
                className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                autoFocus
              />
              <Button
                onClick={handleQuickSend}
                size="icon"
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-md h-8 w-8"
                disabled={!quickInput.trim()}
              >
                <Send size={14} />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 gap-0 rounded-xl bg-[#1A1D2D] text-white border-gray-800 shadow-2xl animate-scale-in">
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-red-700 to-red-600 rounded-t-xl">
            <div className="flex items-center">
              <Heart className="mr-2 h-5 w-5 text-white fill-white animate-pulse-soft" />
              <h3 className="font-semibold">LiebefeldBot</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-200 hover:text-white hover:bg-red-700/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-gradient-to-b from-[#1A1D2D] to-[#131722]">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!message.isUser && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot" alt="LiebefeldBot" />
                    <AvatarFallback>LB</AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.isUser
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                        : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-md border border-gray-700/30'
                    }`}
                  >
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: message.text }}></div>
                    
                    {message.eventData && <EventCard event={message.eventData} />}
                    
                    {message.media_url && (
                      <div className="mt-2">
                        <img 
                          src={message.media_url} 
                          alt="Shared media" 
                          className="rounded-md max-w-full max-h-[200px] object-contain"
                        />
                      </div>
                    )}
                    
                    <span className="text-xs opacity-70 mt-1 block">
                      {format(message.timestamp, 'HH:mm')}
                    </span>
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
                  
                  {message.isUser && (
                    <div className="flex justify-end mt-1">
                      {message.read_by && message.read_by.length > 1 ? (
                        <CheckCheck className="h-3 w-3 text-primary" />
                      ) : (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col ml-1">
                  {message.isUser && (
                    <Avatar className="h-8 w-8 ml-2 mt-1">
                      <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                      <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
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
            ))}
            {isTyping && (
              <div className="flex justify-start mt-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot" alt="LiebefeldBot" />
                  <AvatarFallback>LB</AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg px-3 py-1.5 max-w-[80%] border border-gray-700/30 shadow-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-gray-800 bg-[#131722] rounded-b-xl">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleFileUpload} 
                variant="outline"
                size="icon"
                type="button"
                className="h-10 w-10 rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700"
                title="Bild teilen"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Popover open={isEventSelectOpen} onOpenChange={setIsEventSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-10 w-10 rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700"
                    title="Event teilen"
                    onClick={() => {
                      console.log("Calendar button clicked");
                      setIsEventSelectOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0 max-h-[400px] overflow-y-auto" 
                  side="top" 
                  align="end"
                  sideOffset={5}
                >
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
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-3">
                    {filteredEvents && filteredEvents.length > 0 ? (
                      filteredEvents
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map(event => (
                          <div
                            key={event.id}
                            className="cursor-pointer hover:bg-muted/80 rounded p-2 transition-colors"
                            onClick={() => {
                              console.log("Selecting event:", event.id);
                              handleEventSelect(event.id);
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs text-muted-foreground flex flex-col mt-1">
                              <div className="flex items-center font-medium text-primary">
                                <Calendar className="h-3 w-3 mr-1" />
                                {event.date}
                              </div>
                              <div>Zeit: {event.time}</div>
                              {event.location && <div>Ort: {event.location}</div>}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-2">
                        {eventSearchQuery.trim() ? "Keine passenden Events gefunden" : "Keine Events verfügbar"}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                type="text"
                placeholder="Frag mich nach Liebefeld Events..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-gray-800 border-gray-700 focus:ring-red-500 focus:border-red-500 text-white"
              />
              <Button
                onClick={() => handleSend()}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-md"
                disabled={!input.trim() && !fileInputRef.current?.files?.length || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventChatBot;

