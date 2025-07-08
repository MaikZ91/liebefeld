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
  hasButtons?: boolean;
  buttons?: Array<{
    text: string;
    action: () => void;
    variant?: 'default' | 'outline';
  }>;
}

type MatchingStep = 'start' | 'mood' | 'events' | 'create' | 'complete';

const TribeFinder: React.FC<TribeFinderProps> = ({ open, onOpenChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<MatchingStep>('start');
  const [userPreferences, setUserPreferences] = useState({
    activity: '',
    mood: '',
    selectedEvent: null
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUserProfile();

  const username = userProfile?.username || 'Du';
  const userAvatar = userProfile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;

  const activityButtons = [
    'Tanzen', 'Chillen', 'Kaffee trinken', 'Spazieren', 
    'Sport', 'Kino', 'Konzert', 'Brettspielabend'
  ];

  const moodButtons = [
    { text: 'Ruhig', emoji: '🧘' },
    { text: 'Gesellig', emoji: '🎉' },
    { text: 'Abenteuerlich', emoji: '✨' }
  ];

  useEffect(() => {
    if (open && messages.length === 0) {
      startMatchingFlow();
    }
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (message: string, hasButtons: boolean = false, buttons: Array<{text: string; action: () => void; variant?: 'default' | 'outline'}> = []) => {
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'AI-Bot',
        message,
        timestamp: new Date(),
        isBot: true,
        hasButtons,
        buttons
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: username,
      message,
      timestamp: new Date(),
      isBot: false
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const startMatchingFlow = () => {
    setIsTyping(true);
    setCurrentStep('start');
    addBotMessage('Hey, worauf hast du heute Lust? 😄', true, [
      ...activityButtons.map(activity => ({
        text: activity,
        action: () => selectActivity(activity),
        variant: 'outline' as const
      }))
    ]);
  };

  const selectActivity = (activity: string) => {
    setUserPreferences(prev => ({ ...prev, activity }));
    addUserMessage(activity);
    setIsTyping(true);
    setCurrentStep('mood');
    addBotMessage('Wie fühlst du dich heute – eher ruhig, gesellig oder abenteuerlustig?', true, [
      ...moodButtons.map(mood => ({
        text: `${mood.emoji} ${mood.text}`,
        action: () => selectMood(mood.text),
        variant: 'outline' as const
      }))
    ]);
  };

  const selectMood = (mood: string) => {
    setUserPreferences(prev => ({ ...prev, mood }));
    addUserMessage(mood);
    setIsTyping(true);
    setCurrentStep('events');
    
    // Simulate event suggestions based on activity and mood
    addBotMessage('Perfekt! Ich habe ein paar Events gefunden, die zu dir passen könnten:', true, [
      {
        text: '🎉 Salsa-Abend im Café Central',
        action: () => selectEvent('Salsa-Abend'),
        variant: 'outline'
      },
      {
        text: '🎶 Live-Musik im Parkhaus',
        action: () => selectEvent('Live-Musik'),
        variant: 'outline'
      },
      {
        text: '🍕 Pizza & Brettspiele bei Mario',
        action: () => selectEvent('Pizza & Brettspiele'),
        variant: 'outline'
      },
      {
        text: 'Nix für mich',
        action: () => noEventInterest(),
        variant: 'default'
      }
    ]);
  };

  const selectEvent = (eventName: string) => {
    addUserMessage(`Ich geh hin: ${eventName}`);
    setIsTyping(true);
    addBotMessage('Nice! Möchtest du mit jemandem gemeinsam hingehen?', true, [
      {
        text: 'Ja, connecten',
        action: () => connectWithOthers(),
        variant: 'default'
      },
      {
        text: 'Nein, alleine los',
        action: () => goAlone(),
        variant: 'outline'
      }
    ]);
  };

  const connectWithOthers = () => {
    addUserMessage('Ja, connecten');
    setIsTyping(true);
    addBotMessage('Super! Hier sind Leute, die auch hingehen:', true, [
      {
        text: '👩 Julia (25) - auch Tanzen',
        action: () => connectToUser('Julia'),
        variant: 'outline'
      },
      {
        text: '👨 Max (28) - Musik-Fan',
        action: () => connectToUser('Max'),
        variant: 'outline'
      },
      {
        text: 'Community-Chat beitreten',
        action: () => joinCommunityChat(),
        variant: 'default'
      }
    ]);
  };

  const connectToUser = (userName: string) => {
    addUserMessage(`Mit ${userName} verbinden`);
    setIsTyping(true);
    addBotMessage(`Perfekt! Ich habe ${userName} eine Nachricht geschickt. Viel Spaß heute Abend! 🎉`);
    setTimeout(() => onOpenChange(false), 2000);
  };

  const joinCommunityChat = () => {
    addUserMessage('Community-Chat beitreten');
    setIsTyping(true);
    addBotMessage('Du bist jetzt im Event-Chat! Alle Teilnehmer können sich dort austauschen. Viel Spaß! ✨');
    setTimeout(() => onOpenChange(false), 2000);
  };

  const goAlone = () => {
    addUserMessage('Nein, alleine los');
    setIsTyping(true);
    addBotMessage('Alles klar! Ich hab dir die Event-Details geschickt. Hab einen tollen Abend! ✨');
    setTimeout(() => onOpenChange(false), 2000);
  };

  const noEventInterest = () => {
    addUserMessage('Nix für mich');
    setIsTyping(true);
    addBotMessage('Verstehe! Willst du was Eigenes starten und andere dazu holen?', true, [
      {
        text: 'Ja, Event erstellen',
        action: () => createEvent(),
        variant: 'default'
      },
      {
        text: 'Nein',
        action: () => endConversation(),
        variant: 'outline'
      }
    ]);
  };

  const createEvent = () => {
    addUserMessage('Ja, Event erstellen');
    setIsTyping(true);
    addBotMessage('Super! Ich helfe dir dabei. Was willst du machen?');
    setCurrentStep('create');
  };

  const endConversation = () => {
    addUserMessage('Nein');
    setIsTyping(true);
    addBotMessage('Alles klar, dann genieße deinen Tag. Ich bin später wieder für dich da ✨');
    setTimeout(() => onOpenChange(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (currentStep === 'create') {
      // Handle event creation input
      addUserMessage(inputMessage);
      setInputMessage('');
      setIsTyping(true);
      addBotMessage('Tolle Idee! Ich erstelle das Event für dich und lade andere aus der Community ein. 🎉');
      setTimeout(() => onOpenChange(false), 2000);
      return;
    }

    // For other steps, just echo the input
    addUserMessage(inputMessage);
    setInputMessage('');
    setIsTyping(true);
    addBotMessage('Verstehe! Lass mich das für dich organisieren...');
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
      <DialogContent className="sm:max-w-sm h-[500px] flex flex-col p-0 bg-black rounded-3xl border-0 shadow-2xl">
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
            <div key={msg.id} className="space-y-2">
              <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[85%]">
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
              
              {/* Buttons */}
              {msg.hasButtons && msg.buttons && (
                <div className="flex flex-wrap gap-2 justify-start ml-2">
                  {msg.buttons.map((button, index) => (
                    <Button
                      key={index}
                      variant={button.variant || 'outline'}
                      size="sm"
                      onClick={button.action}
                      className={`text-xs ${
                        button.variant === 'default' 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              )}
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