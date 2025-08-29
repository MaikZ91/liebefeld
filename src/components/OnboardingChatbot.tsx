// src/components/OnboardingChatbot.tsx
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
import { setCoachingEnabled } from '@/services/challengeService';
// Use the uploaded image
const chatbotAvatar = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';
import { supabase } from '../integrations/supabase/client';

const initAnonUser = async () => {
  const { data: session } = await supabase.auth.getSession();
  let uid = session?.session?.user?.id;

  if (!uid) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('❌ Anonyme Anmeldung fehlgeschlagen:', error);
      return;
    }
    uid = data.user.id;
    console.log('✅ Anonymer Supabase-User erstellt');
  }

  /* ▼ Tabelle heißt laut generierten Typen user_profiles  */
  await supabase
    .from('user_profiles')
    .upsert({ 
      id: uid, 
      username: `user_${uid.slice(0, 8)}`,
      onboarding_steps: [] 
    }, { onConflict: 'id' });
};


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

  /* ▼ RPC als any casten, damit TS nicht meckert */
  await (supabase as any).rpc('append_onboarding_step_jsonb', {
    uid: userId,
    new_step: payload,
  });
};

interface OnboardingChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (action: 'community_chat' | 'event_heatmap') => void; // Updated to pass action
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
    wantsNotifications: false, // This field remains but might not be directly used for the final decision anymore
    finalOnboardingAction: '' as 'community_chat' | 'event_heatmap' | '' // New field to store the final choice
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
        'Hey du! Willkommen bei THE TRIBE. Ich bin Mia, deine persönliche Event-Assistentin. Ich helfe dir, coole Leute und Veranstaltungen in deiner Stadt zu finden. Du liebst reale Verbindungen? Dann mach dich bereit!',
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
          // Here, we rely on the component re-rendering to pick up the latest userData.interests
          // The variant will be determined at render time based on the current state.
          variant: 'outline' as const // Default to outline, color will be set by `className` based on selection
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
      return { ...prev, interests: newInterests }; // This correctly updates the state
    });
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

  // Modified function - skip coaching question temporarily
  const proceedToNotifications = () => {
    setIsTyping(true);
    setCurrentStep('notifications');
    // Skip coaching question and go directly to final choice
    addBotMessage('Möchtest du dich mit anderen Tribes verbinden oder passende Events vorgeschlagen bekommen?', true, [
      {
        text: 'Mit Tribes verbinden',
        action: () => handleFinalChoice('community_chat'),
        variant: 'default'
      },
      {
        text: 'Events entdecken',
        action: () => handleFinalChoice('event_heatmap'),
        variant: 'outline'
      }
    ]);
  };

  const handleCoachingChoice = async (enableCoaching: boolean) => {
    setUserData(prev => ({ ...prev, wantsNotifications: enableCoaching }));
    addUserMessage(enableCoaching ? 'MIA Coach aktivieren' : 'Überspringen');
    
    // Save coaching preference to database
    if (userData.username) {
      try {
        await setCoachingEnabled(userData.username, enableCoaching);
      } catch (error) {
        console.error('Error saving coaching preference:', error);
      }
    }
    
    setIsTyping(true);
    // Now proceed to final choice
    addBotMessage('Möchtest du dich mit anderen Tribes verbinden oder passende Events vorgeschlagen bekommen?', true, [
      {
        text: 'Mit Tribes verbinden',
        action: () => handleFinalChoice('community_chat'),
        variant: 'default'
      },
      {
        text: 'Events entdecken',
        action: () => handleFinalChoice('event_heatmap'),
        variant: 'outline'
      }
    ]);
  };

  // New function to handle the final choice and trigger onboarding completion
  const handleFinalChoice = (choice: 'community_chat' | 'event_heatmap') => {
    setUserData(prev => ({ ...prev, finalOnboardingAction: choice })); // Store the choice
    addUserMessage(choice === 'community_chat' ? 'Mit Tribes verbinden' : 'Events entdecken');
    finishOnboarding(choice); // Pass the choice to finishOnboarding
  };

  // Modified finishOnboarding to accept the final action
  const finishOnboarding = async (finalAction: 'community_chat' | 'event_heatmap') => {
    await trackStep('onboarding_completed', finalAction);
    setIsTyping(true);
    setCurrentStep('complete');

    try {
      // Save user profile to database
      localStorage.setItem(USERNAME_KEY, userData.username);
      if (userData.avatar) {
        localStorage.setItem(AVATAR_KEY, userData.avatar);
      }

      console.log('Onboarding: Saving profile with avatar URL:', userData.avatar);
      
      await userService.createOrUpdateProfile({
        username: userData.username,
        avatar: userData.avatar || null,
        interests: userData.interests,
        favorite_locations: userData.city ? [userData.city] : [],
        hobbies: []
      });
      
      console.log('Onboarding: Profile saved successfully');

      // sendWelcomeMessageToChat() is now called unconditionally
      await sendWelcomeMessageToChat();

      const successMessage = finalAction === 'community_chat'
        ? `Super! Du bist bereit, dich mit anderen Tribes zu verbinden. Wir sehen uns im Community-Chat! 🎉`
        : `Du bist bereit! 🎉 Ich finde jetzt passende Events und Leute für dich in ${userData.city}.`;

      addBotMessage(successMessage, true, [
        {
          text: 'Los geht\'s!',
          action: () => {
            onOpenChange(false);
            // Only redirect to challenge page if coaching was enabled
            if (userData.wantsNotifications && finalAction === 'community_chat') {
              // Redirect to challenge page instead of community chat when coaching is enabled
              onComplete?.('event_heatmap'); // This will redirect to heatmap, then navigate to challenge
              setTimeout(() => {
                window.location.href = '/challenge';
              }, 100);
            } else {
              onComplete?.(finalAction); // Normal flow
            }
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

  const sendWelcomeMessageToChat = async () => {
    try {
      // Get the city abbreviation for the group ID
      const cityObject = cities.find(c => c.name.toLowerCase() === userData.city.toLowerCase());
      const cityAbbr = cityObject ? cityObject.abbr.toLowerCase() : userData.city.toLowerCase().replace(/[^a-z]/g, '');
      const groupId = `${cityAbbr}_ausgehen`; // Use the correct format: cityAbbr_ausgehen
      
      // Create welcome message from MIA
      const welcomeMessage = `Hey ${userData.username},willkommen bei uns in der Community 🎉 Erzähl doch kurz: 1️⃣ Was machst du in Bielefeld? 2️⃣ Deine Lieblingsaktivität (#sport, #ausgehen,#kreativität…)? 3️⃣ Fun Fact über dich 😄 

Liebe Grüße
Mia 💕`;

      console.log(`Sending welcome message to group: ${groupId} for user: ${userData.username}`);

      // Send message to city's community chat
      await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          sender: 'MIA',
          text: welcomeMessage,
          avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png'
        });
      
      console.log(`Welcome message sent to ${groupId} community chat for ${userData.username}`);
    } catch (error) {
      console.error('Error sending welcome message to chat:', error);
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
      <DialogContent 
        className="sm:max-w-lg h-[80vh] max-h-[700px] flex flex-col p-0 bg-black/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl z-[9999] fixed overflow-hidden"
        showCloseButton={false}
      >
        {/* Gradient Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-kreativität-primary/10 pointer-events-none" />
        
        {/* Header */}
        <DialogHeader className="relative px-6 py-4 shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-white font-serif text-xl tracking-wide bg-gradient-to-r from-white to-white/80 bg-clip-text">
              THE TRIBE
            </DialogTitle>
            <div className="w-10 h-10" />
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 scrollbar-thin relative">
          {messages.map((msg, index) => (
            <div key={msg.id} className="space-y-3 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                {msg.isBot && (
                  <div className="relative mr-3 mt-1 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 p-0.5">
                      <img 
                        src={chatbotAvatar} 
                        alt="Event Guide" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black/90" />
                  </div>
                )}
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-3xl px-6 py-4 backdrop-blur-md transition-all duration-300 hover-scale ${
                      msg.isBot
                        ? 'bg-white/95 text-gray-800 shadow-lg border border-white/20'
                        : 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg'
                    }`}
                  >
                    <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                  </div>
                  <p className="text-xs text-white/50 mt-2 px-2 font-mono">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
              
              {/* Interest buttons with special handling */}
              {currentStep === 'interests' && msg.message.includes('Was interessiert dich besonders?') ? (
                <div className="flex flex-wrap gap-3 ml-13 animate-fade-in" style={{animationDelay: `${(index + 1) * 0.1}s`}}>
                  {interests.map((interest, buttonIndex) => (
                    <Button
                      key={buttonIndex}
                      onClick={() => toggleInterest(interest.text)}
                      variant="outline"
                      size="sm"
                      className={`text-sm transition-all duration-300 hover-scale backdrop-blur-md border-2 font-medium ${
                        userData.interests.includes(interest.text)
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                      }`}
                    >
                      {`${interest.emoji} ${interest.text}`}
                    </Button>
                  ))}
                  <Button
                    onClick={proceedToAvatar}
                    variant="default"
                    size="sm"
                    className="text-sm transition-all duration-300 hover-scale backdrop-blur-md border-2 font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-primary shadow-lg shadow-primary/20"
                  >
                    Weiter →
                  </Button>
                </div>
              ) : msg.hasButtons && msg.buttons && (
                <div className="flex flex-wrap gap-3 ml-13 animate-fade-in" style={{animationDelay: `${(index + 1) * 0.1}s`}}>
                  {msg.buttons.map((button, buttonIndex) => (
                    <Button
                      key={buttonIndex}
                      onClick={button.action}
                      variant={button.variant}
                      size="sm"
                      className={`text-sm transition-all duration-300 hover-scale backdrop-blur-md border-2 font-medium ${
                        button.variant === 'default'
                          ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                      }`}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="relative mr-3 mt-1 shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 p-0.5">
                  <img 
                    src={chatbotAvatar} 
                    alt="Event Guide" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black/90 animate-pulse" />
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-3xl px-6 py-4 max-w-[85%] shadow-lg border border-white/20">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-gray-500 text-xs ml-2">Mia tippt...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {(currentStep === 'name' || currentStep === 'city') && (
          <div className="p-6 shrink-0 border-t border-white/10 backdrop-blur-md relative">
            <div className="flex items-center space-x-3">
              {currentStep === 'city' && <Search className="h-5 w-5 text-white/60 absolute left-9 z-10" />}
              <Input
                placeholder={currentStep === 'city' ? "In welcher Stadt bist du?" : "Wie heißt du?"}
                value={currentStep === 'city' ? citySearch : inputMessage}
                onChange={(e) => {
                  if (currentStep === 'city') {
                    setCitySearch(e.target.value);
                  } else {
                    setInputMessage(e.target.value);
                  }
                }}
                onKeyPress={handleKeyPress}
                className={`flex-1 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl py-4 text-white placeholder:text-white/60 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 font-medium ${
                  currentStep === 'city' ? 'pl-12 pr-5' : 'px-5'
                }`}
              />
              <Button
                onClick={handleSendMessage}
                disabled={currentStep === 'name' ? !inputMessage.trim() : !citySearch.trim()}
                size="icon"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white rounded-2xl h-12 w-12 shadow-lg shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:shadow-none hover-scale border-2 border-primary"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* City suggestions */}
            {currentStep === 'city' && citySearch.length > 0 && filteredCities.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {filteredCities.map((city, index) => (
                  <button
                    key={city.name}
                    onClick={() => selectCity(city.name)}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-2xl text-sm flex items-center text-white/80 hover:text-white transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/20 animate-fade-in"
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <Search className="h-4 w-4 mr-3 text-primary" />
                    <span className="font-medium">{city.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden file input for image upload */}
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