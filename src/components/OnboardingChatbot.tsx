// src/components/OnboardingChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Upload, Search, X } from 'lucide-react';
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
      const welcomeMessage = `#ausgehen Hey ${userData.username},willkommen bei uns in der Community 🎉 Erzähl doch kurz: 1️⃣ Was machst du in Bielefeld? 2️⃣ Deine Lieblingsaktivität (#sport, #ausgehen,#kreativität…)? 3️⃣ Fun Fact über dich 😄 

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-br from-gray-950 via-black to-gray-900 overflow-hidden">
        {/* Header */}
        <div className="relative px-4 py-3 shrink-0 bg-black/40 backdrop-blur-xl border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={chatbotAvatar} />
                <AvatarFallback className="bg-primary/20 text-white text-xs">
                  MIA
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-white font-medium text-sm">
                  MIA
                </div>
                <div className="text-white/50 text-xs">
                  Deine Event-Assistentin
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 scrollbar-none relative bg-gradient-to-b from-transparent to-black/20">
          {messages.map((msg, index) => (
            <div key={msg.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className={`flex items-start gap-2 ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                {msg.isBot && (
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={chatbotAvatar} />
                      <AvatarFallback className="bg-primary/20 text-white text-xs">
                        MIA
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
                <div className={`flex flex-col gap-1 max-w-[75%] ${!msg.isBot ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">{msg.sender}</span>
                    <span className="text-xs text-white/30">{formatTime(msg.timestamp)}</span>
                  </div>
                  
                  <div
                    className={`
                      px-4 py-2.5 rounded-2xl backdrop-blur-sm transition-all
                      ${msg.isBot 
                        ? 'bg-white/10 border border-white/10 rounded-tl-sm' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 rounded-tr-sm text-white shadow-lg shadow-red-500/20'
                      }
                    `}
                  >
                    <p className={`text-sm leading-relaxed ${msg.isBot ? 'text-white/90' : 'text-white'}`}>
                      {msg.message}
                    </p>
                  </div>
                </div>
                
                {!msg.isBot && (
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={userData.avatar} />
                      <AvatarFallback className="bg-primary/20 text-white text-xs">
                        {getInitials(msg.sender)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
              
              {/* Interest buttons with special handling */}
              {currentStep === 'interests' && msg.message.includes('Was interessiert dich besonders?') ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {interests.map((interest, buttonIndex) => (
                    <Button
                      key={buttonIndex}
                      onClick={() => toggleInterest(interest.text)}
                      variant="outline"
                      size="sm"
                      className={`
                        h-8 rounded-full px-3 text-xs font-medium transition-all duration-200
                        ${userData.interests.includes(interest.text)
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-lg shadow-red-500/30'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      {`${interest.emoji} ${interest.text}`}
                    </Button>
                  ))}
                  <Button
                    onClick={proceedToAvatar}
                    variant="default"
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30"
                  >
                    Weiter →
                  </Button>
                </div>
              ) : msg.hasButtons && msg.buttons && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.buttons.map((button, buttonIndex) => (
                    <Button
                      key={buttonIndex}
                      onClick={button.action}
                      variant={button.variant}
                      size="sm"
                      className={`
                        h-8 rounded-full px-3 text-xs font-medium transition-all duration-200
                        ${button.variant === 'default'
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }
                      `}
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
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarImage src={chatbotAvatar} />
                  <AvatarFallback className="bg-primary/20 text-white text-xs">
                    MIA
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/50">Event-Guide</span>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white/10 border border-white/10 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* City suggestions dropdown */}
        {currentStep === 'city' && citySearch.length > 0 && filteredCities.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in mx-4">
            <div className="max-h-48 overflow-y-auto scrollbar-none">
              {filteredCities.map((city) => (
                <button
                  key={city.abbr}
                  onClick={() => selectCity(city.name)}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5 text-white/40" />
                  <span>{city.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        {(currentStep === 'name' || currentStep === 'city') && (
          <div className="relative px-4 py-3 shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
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
                  placeholder={
                    currentStep === 'name' 
                      ? "Dein Name..." 
                      : currentStep === 'city'
                      ? "Stadt eingeben..."
                      : "Nachricht schreiben..."
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-red-500/50 rounded-xl h-10 transition-all"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={
                  (currentStep === 'name' && !inputMessage.trim()) || 
                  (currentStep === 'city' && !citySearch.trim())
                }
                size="icon"
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-white/5 disabled:to-white/5 disabled:text-white/30 shadow-lg shadow-red-500/20 transition-all"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
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
    </div>
  );
};

export default OnboardingChatbot;