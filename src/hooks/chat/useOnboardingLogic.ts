// Hook for onboarding chat logic
import { useState, useRef, useEffect } from 'react';
import { userService } from '@/services/userService';
import { cities } from '@/contexts/EventContext';
import { toast } from '@/hooks/use-toast';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { supabase } from '@/integrations/supabase/client';

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

const chatbotAvatar = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

export const useOnboardingLogic = (
  onComplete?: (action: 'community_chat' | 'event_heatmap') => void,
  setSelectedCity?: (city: string) => void
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('start');
  const [userData, setUserData] = useState({
    username: '',
    city: '',
    interests: [] as string[],
    avatar: '',
    finalOnboardingAction: '' as 'community_chat' | 'event_heatmap' | ''
  });
  const [citySearch, setCitySearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const interests = [
    { emoji: '🎨', text: 'Kreativ' },
    { emoji: '🏃', text: 'Sport' },
    { emoji: '💃', text: 'Ausgehen' },
    { emoji: '🧘', text: 'Entspannen' },
    { emoji: '🎶', text: 'Musik' },
    { emoji: '🎬', text: 'Film & Kultur' },
    { emoji: '🧑‍🤝‍🧑', text: 'Leute treffen' }
  ];

  // Initialize onboarding
  useEffect(() => {
    if (messages.length === 0) {
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
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (message: string, hasButtons: boolean = false, buttons: Array<{text: string; action: () => void; variant?: 'default' | 'outline'}> = []) => {
    setIsTyping(true);
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
    setCitySearch('');
  };

  const startOnboarding = () => {
    setCurrentStep('name');
    addBotMessage('Wie möchtest du genannt werden?');
  };

  const handleNameSubmit = () => {
    if (!inputMessage.trim()) return;
    
    const name = inputMessage.trim();
    setUserData(prev => ({ ...prev, username: name }));
    addUserMessage(name);
    setCurrentStep('city');
    addBotMessage('In welcher Stadt bist du unterwegs? Tippe einfach den Anfang deiner Stadt:', false);
  };

  const selectCity = (city: string) => {
    const cityObject = cities.find(c => c.name.toLowerCase() === city.toLowerCase());
    const cityAbbr = cityObject ? cityObject.abbr : city.toLowerCase().replace(/[^a-z]/g, '');
    
    setUserData(prev => ({ ...prev, city }));
    
    // Update global city selection
    if (setSelectedCity) {
      setTimeout(() => {
        setSelectedCity(cityAbbr);
      }, 100);
    }
    
    addUserMessage(city);
    setCurrentStep('interests');
    
    setTimeout(() => {
      addBotMessage('Was interessiert dich besonders?', true, [
        ...interests.map(interest => ({
          text: `${interest.emoji} ${interest.text}`,
          action: () => toggleInterest(interest.text),
          variant: 'outline' as const
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
  };

  const proceedToAvatar = () => {
    if (userData.interests.length > 0) {
      addUserMessage(`Ausgewählt: ${userData.interests.join(', ')}`);
    }
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
    setCurrentStep('notifications');
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

  const handleFinalChoice = (choice: 'community_chat' | 'event_heatmap') => {
    setUserData(prev => ({ ...prev, finalOnboardingAction: choice }));
    addUserMessage(choice === 'community_chat' ? 'Mit Tribes verbinden' : 'Events entdecken');
    finishOnboarding(choice);
  };

  const finishOnboarding = async (finalAction: 'community_chat' | 'event_heatmap') => {
    setCurrentStep('complete');

    try {
      // Save user profile
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

      await sendWelcomeMessageToChat();

      const successMessage = finalAction === 'community_chat'
        ? `Super! Du bist bereit, dich mit anderen Tribes zu verbinden. Wir sehen uns im Community-Chat! 🎉`
        : `Du bist bereit! 🎉 Ich finde jetzt passende Events und Leute für dich in ${userData.city}.`;

      addBotMessage(successMessage, true, [
        {
          text: 'Los geht\'s!',
          action: () => {
            onComplete?.(finalAction);
          },
          variant: 'default'
        }
      ]);

      toast({
        title: `Willkommen ${userData.username}!`,
        description: 'Dein Profil wurde erfolgreich erstellt.',
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
      const cityObject = cities.find(c => c.name.toLowerCase() === userData.city.toLowerCase());
      const cityAbbr = cityObject ? cityObject.abbr.toLowerCase() : userData.city.toLowerCase().replace(/[^a-z]/g, '');
      const groupId = `${cityAbbr}_ausgehen`;
      
      const welcomeMessage = `#ausgehen Hey ${userData.username}, willkommen bei uns in der Community 🎉 Erzähl doch kurz: 1️⃣ Was machst du in ${userData.city}? 2️⃣ Deine Lieblingsaktivität (#sport, #ausgehen, #kreativität…)? 3️⃣ Fun Fact über dich 😄 

Liebe Grüße
Mia 💕`;

      await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          sender: 'MIA',
          text: welcomeMessage,
          avatar: chatbotAvatar
        });
    } catch (error) {
      console.error('Error sending welcome message to chat:', error);
    }
  };

  const handleSendMessage = () => {
    if (currentStep === 'name' && inputMessage.trim()) {
      handleNameSubmit();
    } else if (currentStep === 'city' && citySearch.trim()) {
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
      selectCity(citySearch.trim());
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().startsWith(citySearch.toLowerCase())
  ).slice(0, 6);

  return {
    messages,
    inputMessage,
    setInputMessage,
    citySearch,
    setCitySearch,
    isTyping,
    currentStep,
    userData,
    messagesEndRef,
    fileInputRef,
    handleSendMessage,
    handleImageUpload,
    filteredCities,
    selectCity,
    toggleInterest,
    interests,
    chatbotAvatar
  };
};
