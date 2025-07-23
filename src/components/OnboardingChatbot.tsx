// src/components/OnboardingChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // DialogContent importieren
import { Button } from '@/components/ui/button'; //
import { Input } from '@/components/ui/input'; //
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; //
import { Send, ArrowLeft, Upload, Search } from 'lucide-react'; //
import { getInitials } from '@/utils/chatUIUtils'; //
import { userService } from '@/services/userService'; //
import { cities, useEventContext } from '@/contexts/EventContext'; //
import { toast } from '@/hooks/use-toast'; //
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes'; //
// Use the uploaded image
const chatbotAvatar = '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png'; //
import { supabase } from '../integrations/supabase/client'; //

const initAnonUser = async () => {
  const { data: session } = await supabase.auth.getSession(); //
  let uid = session?.session?.user?.id; //

  if (!uid) { //
    const { data, error } = await supabase.auth.signInAnonymously(); //
    if (error) { //
      console.error('❌ Anonyme Anmeldung fehlgeschlagen:', error); //
      return; //
    }
    uid = data.user.id; //
    console.log('✅ Anonymer Supabase-User erstellt'); //
  }

  /* ▼ Tabelle heißt laut generierten Typen user_profiles  */
  await supabase
    .from('user_profiles') //
    .upsert({ 
      id: uid, 
      username: `user_${uid.slice(0, 8)}`,
      onboarding_steps: [] 
    }, { onConflict: 'id' }); //
};


const trackStep = async (
  step: string,
  value?: any,
  includeTimestamp = false
) => {
  const { data: userData } = await supabase.auth.getUser(); //
  const userId = userData?.user?.id; //
  if (!userId) return; //

  const payload: Record<string, any> = { step }; //
  if (value !== undefined) payload.value = value; //
  if (includeTimestamp) payload.timestamp = new Date().toISOString(); //

  /* ▼ RPC als any casten, damit TS nicht meckert */
  await (supabase as any).rpc('append_onboarding_step_jsonb', {
    uid: userId,
    new_step: payload,
  }); //
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
  const [messages, setMessages] = useState<ChatMessage[]>([]); //
  const [inputMessage, setInputMessage] = useState(''); //
  const [isTyping, setIsTyping] = useState(false); //
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('start'); //
  const [userData, setUserData] = useState({
    username: '',
    city: '',
    interests: [] as string[],
    avatar: '',
    wantsNotifications: false, // This field remains but might not be directly used for the final decision anymore
    finalOnboardingAction: '' as 'community_chat' | 'event_heatmap' | '' // New field to store the final choice
  }); //
  const [citySearch, setCitySearch] = useState(''); //
  const messagesEndRef = useRef<HTMLDivElement>(null); //
  const fileInputRef = useRef<HTMLInputElement>(null); //
  const { setSelectedCity } = useEventContext(); //
  

  const interests = [
    { emoji: '🎨', text: 'Kreativ' },
    { emoji: '🏃', text: 'Sport' },
    { emoji: '💃', text: 'Ausgehen' },
    { emoji: '🧘', text: 'Entspannen' },
    { emoji: '🎶', text: 'Musik' },
    { emoji: '🎬', text: 'Film & Kultur' },
    { emoji: '🧑‍🤝‍🧑', text: 'Leute treffen' }
  ]; //

  useEffect(() => {
    if (open && messages.length === 0) { //
      addBotMessage(
        'Hey du! Willkommen bei THE TRIBE. Ich bin Mia, deine persönliche Event-Assistentin. Ich helfe dir, coole Leute und Veranstaltungen in deiner Stadt zu finden. Du liebst reale Verbindungen? Dann mach dich bereit!',
        true,
        [{
          text: 'Los geht\'s! 🚀',
          action: () => startOnboarding(),
          variant: 'default'
        }]
      ); //
    }
  }, [open, messages.length]); //

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); //
  }, [messages]); //

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
  }; //

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
  }; //

  const startOnboarding = async () => {
    setIsTyping(true); //
    setCurrentStep('name'); //
    await trackStep('onboarding_started', null, true); //
    addBotMessage('Wie möchtest du genannt werden?'); //
  };

  const handleNameSubmit = async () => {
    if (!inputMessage.trim()) return;
    
    const name = inputMessage.trim();
    setUserData(prev => ({ ...prev, username: name })); //
    addUserMessage(name); //
    await trackStep('name_entered', name); //
    setIsTyping(true); //
    setCurrentStep('city'); //
    addBotMessage('In welcher Stadt bist du unterwegs? Tippe einfach den Anfang deiner Stadt:', false); //
  };

  const selectCity = (city: string) => {
    const cityObject = cities.find(c => c.name.toLowerCase() === city.toLowerCase()); //
    const cityAbbr = cityObject ? cityObject.abbr : city.toLowerCase().replace(/[^a-z]/g, ''); //
    
    setUserData(prev => ({ ...prev, city })); //
    
    // Update global city selection with delay to prevent conflicts
    setTimeout(() => { //
      setSelectedCity(cityAbbr); //
    }, 100); //
    
    addUserMessage(city); //
    setIsTyping(true); //
    setCurrentStep('interests'); //
    setCitySearch(''); // Reset search
    
    // Add small delay before showing interests to ensure smooth transition
    setTimeout(() => { //
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
      ]); //
    }, 200); //
  };

  const toggleInterest = (interest: string) => {
    setUserData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests }; // This correctly updates the state
    }); //
  };

  const proceedToAvatar = async () => {
    await trackStep('interests_submitted', userData.interests); //
    if (userData.interests.length > 0) { //
      addUserMessage(`Ausgewählt: ${userData.interests.join(', ')}`); //
    }
    setIsTyping(true); //
    setCurrentStep('avatar'); //
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
    ]); //
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; //
    if (!file) return; //

    try {
      const avatarUrl = await userService.uploadProfileImage(file); //
      setUserData(prev => ({ ...prev, avatar: avatarUrl })); //
      await trackStep('avatar_uploaded', 'yes'); //
      addUserMessage('Profilbild hochgeladen ✓'); //
      proceedToNotifications(); //
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hochladen des Bildes',
        variant: 'destructive'
      }); //
    }
  };

  // Modified function for new notification preference
  const proceedToNotifications = () => {
    setIsTyping(true); //
    setCurrentStep('notifications'); //
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
    ]); //
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
            onComplete?.(finalAction); // Pass the action back to the parent
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
      const cityObject = cities.find(c => c.name.toLowerCase() === userData.city.toLowerCase()); //
      const cityAbbr = cityObject ? cityObject.abbr.toLowerCase() : userData.city.toLowerCase().replace(/[^a-z]/g, ''); //
      const groupId = `${cityAbbr}_ausgehen`; // Use the correct format: cityAbbr_ausgehen
      
      // Create welcome message from MIA
      const welcomeMessage = `Hallo ${userData.username}, willkommen bei uns in der Community! Stelle dich gerne vor. 

Liebe Grüße
Mia 💕`; //

      console.log(`Sending welcome message to group: ${groupId} for user: ${userData.username}`); //

      // Send message to city's community chat
      await supabase
        .from('chat_messages') //
        .insert({
          group_id: groupId, //
          sender: 'MIA', //
          text: welcomeMessage, //
          avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f