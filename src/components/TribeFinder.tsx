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

  const username = userProfile?.username || 'Du';
  const userAvatar = userProfile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;

  useEffect(() => {
    if (open && messages.length === 0) {
      // Welcome message when dialog opens
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'TribeBot',
        message: 'Hey! Ich bin hier, um dir zu helfen, deine perfekte Tribe zu finden. Worauf hast du heute Lust?',
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
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 bg-gradient-to-b from-gray-900 to-black border-red-500/20">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-red-500/20 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-white hover:bg-red-500/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              <DialogTitle className="text-white font-bold text-lg">
                THE TRIBE
              </DialogTitle>
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm text-gray-400">
              <MessageSquare className="h-4 w-4" />
              <span>Bot</span>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {!msg.isBot && (
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-8 w-8 border border-red-500/30">
                    <AvatarImage src={userAvatar} alt={msg.sender} />
                    <AvatarFallback className="bg-red-500 text-white text-xs">
                      {getInitials(msg.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white">{msg.sender}</span>
                  <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                </div>
              )}
              
              <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.isBot
                      ? 'bg-gray-800 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  {msg.isBot && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTime(msg.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="bg-gray-800 rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-red-500/20">
          <div className="flex gap-2 mb-3">
            <Button
              size="sm"
              variant="outline"
              className="bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30 text-xs"
              onClick={() => setInputMessage('Soll ich ein neues Treffen für dich erstellen?')}
            >
              ✏️ Neues Treffen erstellen
            </Button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-red-500/20 bg-gray-900/50">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht schreiben..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-red-500 hover:bg-red-600 text-white p-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TribeFinder;