import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Upload, Search } from 'lucide-react';
import { getInitials } from '@/utils/chatUIUtils';
import { userService } from '@/services/userService';
import { cities, useEventContext } from '@/contexts/EventContext';
import { toast } from '@/hooks/use-toast';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
// Use the uploaded image
const chatbotAvatar = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';
import { supabase } from '../integrations/supabase/client';

useEffect(() => {
  const initAnonUser = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error('❌ Anonyme Anmeldung fehlgeschlagen:', error);
      else console.log('✅ Anonymer Supabase-User erstellt');
    }
  };

  initAnonUser();
}, []);


const trackStep = async (
  step: string,
  value?: any,
  includeTimestamp = false
) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return;

  const payload: Record<string, any> = { step };
  if (value !== undefined) payload.value = value;
  if (includeTimestamp) payload.timestamp = new Date().toISOString();

  await supabase.rpc('append_onboarding_step_jsonb', {
    uid: userId,
    new_step: payload
  });
};

interface OnboardingChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
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

type OnboardingStep = 'start' | 'name' | 'city' | 'interests' | 'avatar' | 'notifications' | 'complete';

const OnboardingChatbot: React.FC<OnboardingChatbotProps> = ({ open, onOpenChange, onComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('start');
  const [userData, setUserData] = useState({
    username: '',
    city: '',
    interests: [] as string[],
    avatar: '',
    wantsNotifications: false
  });
  const [citySearch, setCitySearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSelectedCity } = useEventContext();

  const interests = [
    { emoji: '🎨', text: 'Kreativ' },
    { emoji: '🏃', text: 'Sport' },
    { emoji: '💃', text: 'Ausgehen' },
    { emoji: '🧘', text: 'Entspannen' },
    { emoji: '🎶', text: 'Musik' },
    { emoji: '🎬', text: 'Film & Kultur' },
    { emoji: '🧑‍🤝‍🧑', text: 'Leute treffen' }
  ];

  useEffect(() => {
    if (open && messages.length === 0) {
      addBotMessage(
        'Hey du! Willkommen bei THE TRIBE. Ich bin Mia, deine persönliche Event-Assistentin. Ich helfe dir, coole Leute und Veranstaltungen in deiner Stadt zu finden. Du liebst reale Verbindungen?Dann mach dich bereit!',
        true,
        [{
          text: 'Los geht\'s! 🚀',
          action: () => startOnboarding(),
          variant: 'default'
        }]
      );
    }
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (message: string, hasButtons: boolean = false, buttons: Array<{text: string; action: () => void; variant?: 'default' | 'outline'}> = []) => {
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'Event-Guide',
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
      sender: userData.username || 'Du',
      message,
      timestamp: new Date(),
      isBot: false
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
  };

  const startOnboarding = async () => {
    setIsTyping(true);
    setCurrentStep('name');
    await trackStep('onboarding_started', null, true); 
    addBotMessage('Wie möchtest du genannt werden?');
  };

  const handleNameSubmit = async () => {
    if (!inputMessage.trim()) return;
    
    const name = inputMessage.trim();
    setUserData(prev => ({ ...prev, username: name }));
    addUserMessage(name);
    await trackStep('name_entered', name);
    setIsTyping(true);
    setCurrentStep('city');
    addBotMessage('In welcher Stadt bist du unterwegs? Tippe einfach den Anfang deiner Stadt:', false);
  };

  const selectCity = (city: string) => {
    const cityObject = cities.find(c => c.name.toLowerCase() === city.toLowerCase());
    const cityAbbr = cityObject ? cityObject.abbr : city.toLowerCase().replace(/[^a-z]/g, '');
    
    setUserData(prev => ({ ...prev, city }));
    
    // Update global city selection with delay to prevent conflicts
    setTimeout(() => {
      setSelectedCity(cityAbbr);
    }, 100);
    
    addUserMessage(city);
    setIsTyping(true);
    setCurrentStep('interests');
    setCitySearch(''); // Reset search
    
    // Add small delay before showing interests to ensure smooth transition
    setTimeout(() => {
      addBotMessage('Was interessiert dich besonders?', true, [
        ...interests.map(interest => ({
          text: `${interest.emoji} ${interest.text}`,
          action: () => toggleInterest(interest.text),
          variant: userData.interests.includes(interest.text) ? 'default' as const : 'outline' as const
        })),
        {
          text: 'Weiter →',
          action: () => proceedToAvatar(),
          variant: 'default' as const
        }
      ]);
    }, 200);
  };

  const toggleInterest = (interest: string) => {
    setUserData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
    
    // Update the message buttons to reflect selection
    setMessages(prev => prev.map(msg => {
      if (msg.hasButtons && msg.message.includes('Was interessiert dich')) {
        return {
          ...msg,
          buttons: [
            ...interests.map(int => ({
              text: `${int.emoji} ${int.text}`,
              action: () => toggleInterest(int.text),
              variant: userData.interests.includes(int.text) ? 'default' as const : 'outline' as const
            })),
            {
              text: 'Weiter →',
              action: () => proceedToAvatar(),
              variant: 'default' as const
            }
          ]
        };
      }
      return msg;
    }));
  };

  const proceedToAvatar = async () => {
    await trackStep('interests_submitted', userData.interests);
    if (userData.interests.length > 0) {
      addUserMessage(`Ausgewählt: ${userData.interests.join(', ')}`);
    }
    setIsTyping(true);
    setCurrentStep('avatar');
    addBotMessage('Möchtest du ein Profilbild hinzufügen? Optional – hilft dir beim Connecten 😊', true, [
      {
        text: 'Bild hochladen',
        action: () => fileInputRef.current?.click(),
        variant: 'default'
      },
      {
        text: 'Überspringen',
        action: () => proceedToNotifications(),
        variant: 'outline'
      }
    ]);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const avatarUrl = await userService.uploadProfileImage(file);
      setUserData(prev => ({ ...prev, avatar: avatarUrl }));
      await trackStep('avatar_uploaded', 'yes');
      addUserMessage('Profilbild hochgeladen ✓');
      proceedToNotifications();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hochladen des Bildes',
        variant: 'destructive'
      });
    }
  };

  const proceedToNotifications = () => {
    setIsTyping(true);
    setCurrentStep('notifications');
    addBotMessage('Darf ich dir Events vorschlagen, die zu dir passen?', true, [
      {
        text: 'Ja klar!',
        action: () => enableNotifications(true),
        variant: 'default'
      },
      {
        text: 'Später vielleicht',
        action: () => enableNotifications(false),
        variant: 'outline'
      }
    ]);
  };

  const enableNotifications = (enabled: boolean) => {
    setUserData(prev => ({ ...prev, wantsNotifications: enabled }));
    addUserMessage(enabled ? 'Ja klar!' : 'Später vielleicht');
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    await trackStep('onboarding_completed');
    setIsTyping(true);
    setCurrentStep('complete');

    try {
      // Save user profile to database
      localStorage.setItem(USERNAME_KEY, userData.username);
      if (userData.avatar) {
        localStorage.setItem(AVATAR_KEY, userData.avatar);
      }

      await userService.createOrUpdateProfile({
        username: userData.username,
        avatar: userData.avatar || null,
        interests: userData.interests,
        favorite_locations: userData.city ? [userData.city] : [],
        hobbies: []
      });

      addBotMessage(`Du bist bereit! 🎉 Ich finde jetzt passende Events und Leute für dich in ${userData.city}.`, true, [
        {
          text: 'Los geht\'s!',
          action: () => {
            onOpenChange(false);
            onComplete?.();
          },
          variant: 'default'
        }
      ]);

      toast({
        title: `Willkommen ${userData.username}!`,
        description: 'Dein Profil wurde erfolgreich erstellt.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Profils',
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = () => {
    if (currentStep === 'name' && !inputMessage.trim()) return;
    if (currentStep === 'city' && !citySearch.trim()) return;

    if (currentStep === 'name') {
      handleNameSubmit();
    } else if (currentStep === 'city') {
      handleCitySubmit();
    }
  };

  const handleCitySubmit = () => {
    const searchTerm = citySearch.trim().toLowerCase();
    const matchingCity = cities.find(city => 
      city.name.toLowerCase().startsWith(searchTerm)
    );
    
    if (matchingCity) {
      selectCity(matchingCity.name);
    } else {
      // If no exact match, use the input as custom city
      selectCity(citySearch.trim());
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().startsWith(citySearch.toLowerCase())
  ).slice(0, 6); // Show max 6 suggestions

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
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 bg-black rounded-3xl border-0 shadow-2xl z-[9999] fixed">
        {/* Header */}
        <DialogHeader className="px-4 py-3 bg-black text-white relative rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-white font-bold text-base tracking-wider">
              THE TRIBE ONBOARDING
            </DialogTitle>
            <div className="w-8 h-8" /> {/* Spacer */}
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white space-y-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                {msg.isBot && (
                  <img 
                    src={chatbotAvatar} 
                    alt="Event Guide" 
                    className="w-8 h-8 rounded-full mr-3 mt-1 object-cover"
                  />
                )}
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
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input (Name und Stadt) */}
        {(currentStep === 'name' || currentStep === 'city') && (
          <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl shrink-0">
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
              {currentStep === 'city' && <Search className="h-5 w-5 text-gray-400" />}
              <Input
                value={currentStep === 'city' ? citySearch : inputMessage}
                onChange={(e) => {
                  if (currentStep === 'city') {
                    setCitySearch(e.target.value);
                  } else {
                    setInputMessage(e.target.value);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder={currentStep === 'city' ? "Stadt eingeben..." : "Dein Name..."}
                className="flex-1 bg-transparent border-0 text-black placeholder-gray-500 focus:ring-0 focus:outline-none px-0"
              />
              <Button
                onClick={handleSendMessage}
                disabled={currentStep === 'name' ? !inputMessage.trim() || isTyping : !citySearch.trim() || isTyping}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* City suggestions */}
            {currentStep === 'city' && citySearch.length > 0 && filteredCities.length > 0 && (
              <div className="mt-3 space-y-2">
                {filteredCities.map((city) => (
                  <Button
                    key={city.abbr}
                    variant="outline"
                    size="sm"
                    onClick={() => selectCity(city.name)}
                    className="w-full justify-start text-left border-gray-300 hover:bg-gray-100"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingChatbot;