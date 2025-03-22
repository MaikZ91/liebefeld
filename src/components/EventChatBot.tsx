
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Calendar, X, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { type Event } from './EventCalendar';
import { useEventContext } from '@/contexts/EventContext';
import { generateResponse, getWelcomeMessage } from '@/utils/chatUtils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

const USERNAME_KEY = "community_chat_username";
const AVATAR_KEY = "community_chat_avatar";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
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
  
  const { events } = useEventContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log(`EventChatBot received ${events.length} events from context`);
    if (events.length > 0) {
      console.log("Sample events from context:", events.slice(0, 3));
    }
  }, [events]);

  const handleSend = (text = input) => {
    const messageText = text.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setQuickInput('');
    setIsTyping(true);
    setIsOpen(true);

    // Store user's question to analyze later
    const storeUserQuestion = async () => {
      try {
        // Check if we have chat_groups table (only if this is being used with groups page)
        const { data: groupsCheck } = await supabase
          .from('chat_groups')
          .select('id')
          .limit(1);
          
        if (groupsCheck && groupsCheck.length > 0) {
          // Get or create a special group for event bot
          const botGroupName = "LiebefeldBot";
          const { data: botGroup } = await supabase
            .from('chat_groups')
            .select('id')
            .eq('name', botGroupName)
            .single();
            
          let botGroupId;
          
          if (!botGroup) {
            // Create the bot group if it doesn't exist
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
          
          // Store the message
          if (botGroupId) {
            await supabase
              .from('chat_messages')
              .insert({
                group_id: botGroupId,
                sender: username,
                text: messageText,
                avatar: localStorage.getItem(AVATAR_KEY)
              });
          }
        }
      } catch (error) {
        console.error("Error storing user question:", error);
        // Don't interrupt the flow if this fails
      }
    };
    
    storeUserQuestion();

    setTimeout(() => {
      const botResponse = generateResponse(messageText, events);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Also store the bot's response if groups exist
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
                  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=LiebefeldBot"
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
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.isUser
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-md border border-gray-700/30'
                  }`}
                >
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: message.text }}></div>
                  <span className="text-xs opacity-70 mt-1 block">
                    {format(message.timestamp, 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mt-2">
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
                disabled={!input.trim() || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventChatBot;
