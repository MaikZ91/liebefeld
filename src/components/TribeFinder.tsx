import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Users, MessageSquare } from 'lucide-react';
import { getInitials } from '@/utils/chatUIUtils';
import { useUserProfile } from '@/hooks/chat/useUserProfile';

interface TribeFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isBot?: boolean;
}

const TribeFinder: React.FC<TribeFinderProps> = ({ open, onOpenChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUserProfile();

  const username = userProfile?.username || 'Maik Zschach';
  const userAvatar = userProfile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;

  useEffect(() => {
    if (open && messages.length === 0) {
      // Welcome message when dialog opens
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'TribeBot',
        message: 'Hey Maik! Worauf hast du gerade Lust?',
        timestamp: new Date(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: username,
      message: inputMessage,
      timestamp: new Date(),
      isBot: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        'Das klingt interessant! Ich schaue nach Events in deiner Nähe...',
        'Cool! Lass mich schauen, wer noch Lust auf sowas hat.',
        'Ein Bier trinken gehen ist immer eine gute Idee! 🍺',
        'Soll ich ein neues Treffen für dich organisieren?',
        'Ich habe ein paar Leute gefunden, die ähnliche Interessen haben!'
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'TribeBot',
        message: randomResponse,
        timestamp: new Date(),
        isBot: true
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[700px] flex flex-col p-0 bg-white rounded-3xl border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-4 py-4 bg-black text-white relative rounded-t-3xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-white font-bold text-lg tracking-wider">
              THE TRIBE
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">?</span>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">👤👤</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* User Profile Section */}
        <div className="px-6 py-6 bg-white flex flex-col items-center">
          <Avatar className="h-24 w-24 border-4 border-red-500 mb-3">
            <AvatarImage src={userAvatar} alt={username} />
            <AvatarFallback className="bg-red-500 text-white text-lg font-bold">
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-black mb-1">{username}</h2>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 bg-white space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.isBot
                        ? 'bg-gray-200 text-black'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${msg.isBot ? 'text-left' : 'text-right'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          {/* Orange Quick Action Button */}
          <div className="flex justify-center py-2">
            <Button
              onClick={() => setInputMessage('Soll ich ein neues Treffen für dich erstellen?')}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-3 flex items-center gap-2 font-medium"
            >
              <span className="text-lg">✏️</span>
              Soll ich ein neues Treffen für dich erstellen?
            </Button>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht schreiben..."
              className="flex-1 bg-transparent border-0 text-black placeholder-gray-500 focus:ring-0 focus:outline-none px-0"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TribeFinder;