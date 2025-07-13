import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Search } from 'lucide-react';
import { userService } from '@/services/userService';
import { cities, useEventContext } from '@/contexts/EventContext';
import { toast } from '@/hooks/use-toast';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { supabase } from '../integrations/supabase/client';

// Avatar des Chatbots (lokale Datei oder CDN)
const chatbotAvatar =
  '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

/* ------------------------------------------------------------------ */
/* Helper: Anonymen User anlegen + Profil-Stub garantieren            */
/* ------------------------------------------------------------------ */
const initAnonUser = async () => {
  // Aktuelle Session holen
  const { data: session } = await supabase.auth.getSession();
  let uid = session?.session?.user?.id;

  // Falls es noch keine Session gibt: anonym einloggen
  if (!uid) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('❌ Anonyme Anmeldung fehlgeschlagen:', error);
      return;
    }
    uid = data.user.id;
    console.log('✅ Anonymer Supabase-User erstellt');
  }

  // Profil-Stub (Row in "profiles") anlegen, falls noch nicht vorhanden
  await supabase
    .from('profiles')
    .insert({ id: uid, onboarding_steps: '[]' })
    .onConflict('id')
    .ignore();
};

/* ------------------------------------------------------------------ */
/* Helper: Schritt in onboarding_steps schreiben                      */
/* ------------------------------------------------------------------ */
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

  const { error } = await supabase.rpc('append_onboarding_step_jsonb', {
    uid: userId,
    new_step: payload,
  });
  if (error) console.error('[trackStep]', error);
};

/* ================================================================== */
/*                      OnboardingChatbot  Component                  */
/* ================================================================== */
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

type OnboardingStep =
  | 'start'
  | 'name'
  | 'city'
  | 'interests'
  | 'avatar'
  | 'notifications'
  | 'complete';

const OnboardingChatbot: React.FC<OnboardingChatbotProps> = ({
  open,
  onOpenChange,
  onComplete,
}) => {
  /* ---------------- state / refs ---------------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('start');
  const [userData, setUserData] = useState({
    username: '',
    city: '',
    interests: [] as string[],
    avatar: '',
    wantsNotifications: false,
  });
  const [citySearch, setCitySearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSelectedCity } = useEventContext();

  /* ---------------- Konstanten ------------------------------------ */
  const interests = [
    { emoji: '🎨', text: 'Kreativ' },
    { emoji: '🏃', text: 'Sport' },
    { emoji: '💃', text: 'Ausgehen' },
    { emoji: '🧘', text: 'Entspannen' },
    { emoji: '🎶', text: 'Musik' },
    { emoji: '🎬', text: 'Film & Kultur' },
    { emoji: '🧑‍🤝‍🧑', text: 'Leute treffen' },
  ];

  /* ---------------- einmal beim Mount ----------------------------- */
  useEffect(() => {
    initAnonUser();
  }, []);

  /* ---------------- Chat-Intro, wenn Dialog öffnet ---------------- */
  useEffect(() => {
    if (open && messages.length === 0) {
      addBotMessage(
        'Hey du! Willkommen bei THE TRIBE. Ich bin Mia, deine persönliche Event-Assistentin. Ich helfe dir, coole Leute und Veranstaltungen in deiner Stadt zu finden. Du liebst reale Verbindungen? Dann mach dich bereit!',
        true,
        [
          {
            text: "Los geht's! 🚀",
            action: () => startOnboarding(),
            variant: 'default',
          },
        ]
      );
    }
  }, [open, messages.length]);

  /* ---------------- Auto-Scroll ----------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ================================================================ */
  /*                         Helper-Funktionen                        */
  /* ================================================================ */
  const addBotMessage = (
    message: string,
    hasButtons = false,
    buttons: ChatMessage['buttons'] = []
  ) => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'Event-Guide',
          message,
          timestamp: new Date(),
          isBot: true,
          hasButtons,
          buttons,
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: userData.username || 'Du',
        message,
        timestamp: new Date(),
        isBot: false,
      },
    ]);
    setInputMessage('');
  };

  const updateInterestButtons = (current: string[]) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.hasButtons && msg.message.includes('Was interessiert dich')
          ? {
              ...msg,
              buttons: [
                ...interests.map((int) => ({
                  text: `${int.emoji} ${int.text}`,
                  action: () => toggleInterest(int.text),
                  variant: current.includes(int.text) ? 'default' : 'outline',
                })),
                {
                  text: 'Weiter →',
                  action: () => proceedToAvatar(),
                  variant: 'default',
                },
              ],
            }
          : msg
      )
    );
  };

  /* ================================================================ */
  /*                     Onboarding-Workflow                          */
  /* ================================================================ */

  /** Schritt 1: Start */
  const startOnboarding = async () => {
    await initAnonUser(); // Stub sicher vorhanden
    setIsTyping(true);
    setCurrentStep('name');
    await trackStep('onboarding_started', null, true);
    addBotMessage('Wie möchtest du genannt werden?');
  };

  /** Schritt 2: Name eingegeben */
  const handleNameSubmit = async () => {
    if (!inputMessage.trim()) return;

    const name = inputMessage.trim();
    setUserData((prev) => ({ ...prev, username: name }));
    addUserMessage(name);
    await trackStep('name_entered', name);

    setIsTyping(true);
    setCurrentStep('city');
    addBotMessage(
      'In welcher Stadt bist du unterwegs? Tippe einfach den Anfang deiner Stadt:'
    );
  };

  /** Schritt 3: Stadt gewählt */
  const selectCity = (city: string) => {
    const cityObj = cities.find(
      (c) => c.name.toLowerCase() === city.toLowerCase()
    );
    const cityAbbr = cityObj
      ? cityObj.abbr
      : city.toLowerCase().replace(/[^a-z]/g, '');

    setUserData((prev) => ({ ...prev, city }));
    setSelectedCity(cityAbbr);

    addUserMessage(city);
    setIsTyping(true);
    setCurrentStep('interests');
    setCitySearch('');

    setTimeout(() => {
      updateInterestButtons(userData.interests);
      addBotMessage('Was interessiert dich besonders?', true);
    }, 200);
  };

  /** Schritt 4: Interests toggeln */
  const toggleInterest = (interest: string) => {
    setUserData((prev) => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];

      updateInterestButtons(newInterests);
      return { ...prev, interests: newInterests };
    });
  };

  /** Schritt 4b: Weiter zu Avatar */
  const proceedToAvatar = async () => {
    await trackStep('interests_submitted', userData.interests);
    if (userData.interests.length)
      addUserMessage(`Ausgewählt: ${userData.interests.join(', ')}`);

    setIsTyping(true);
    setCurrentStep('avatar');
    addBotMessage(
      'Möchtest du ein Profilbild hinzufügen? Optional – hilft dir beim Connecten 😊',
      true,
      [
        {
          text: 'Bild hochladen',
          action: () => fileInputRef.current?.click(),
          variant: 'default',
        },
        {
          text: 'Überspringen',
          action: () => proceedToNotifications(),
          variant: 'outline',
        },
      ]
    );
  };

  /** Schritt 5: Bild hochladen */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const avatarUrl = await userService.uploadProfileImage(file);
      setUserData((prev) => ({ ...prev, avatar: avatarUrl }));
      await trackStep('avatar_uploaded', 'yes');
      addUserMessage('Profilbild hochgeladen ✓');
      proceedToNotifications();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hochladen des Bildes',
        variant: 'destructive',
      });
    }
  };

  /** Schritt 6: Notifications-Frage */
  const proceedToNotifications = () => {
    setIsTyping(true);
    setCurrentStep('notifications');
    addBotMessage('Darf ich dir Events vorschlagen, die zu dir passen?', true, [
      {
        text: 'Ja klar!',
        action: () => enableNotifications(true),
        variant: 'default',
      },
      {
        text: 'Später vielleicht',
        action: () => enableNotifications(false),
        variant: 'outline',
      },
    ]);
  };

  const enableNotifications = (enabled: boolean) => {
    setUserData((prev) => ({ ...prev, wantsNotifications: enabled }));
    addUserMessage(enabled ? 'Ja klar!' : 'Später vielleicht');
    finishOnboarding();
  };

  /** Schritt 7: Onboarding fertig */
  const finishOnboarding = async () => {
    await trackStep('onboarding_completed');
    setIsTyping(true);
    setCurrentStep('complete');

    try {
      // Profil in Supabase schreiben
      await userService.createOrUpdateProfile({
        username: userData.username,
        avatar: userData.avatar || null,
        interests: userData.interests,
        favorite_locations: userData.city ? [userData.city] : [],
        hobbies: [],
      });

      // LocalStorage
      localStorage.setItem(USERNAME_KEY, userData.username);
      if (userData.avatar) localStorage.setItem(AVATAR_KEY, userData.avatar);

      addBotMessage(
        `Du bist bereit! 🎉 Ich finde jetzt passende Events und Leute für dich in ${userData.city}.`,
        true,
        [
          {
            text: "Los geht's!",
            action: () => {
              onOpenChange(false);
              onComplete?.();
            },
            variant: 'default',
          },
        ]
      );

      toast({
        title: `Willkommen ${userData.username}!`,
        description: 'Dein Profil wurde erfolgreich erstellt.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Profils',
        variant: 'destructive',
      });
    }
  };

  /* ================================================================ */
  /*                    Input-Handling (Enter / Button)               */
  /* ================================================================ */
  const handleSendMessage = () => {
    if (currentStep === 'name' && !inputMessage.trim()) return;
    if (currentStep === 'city' && !citySearch.trim()) return;

    if (currentStep === 'name') handleNameSubmit();
    else if (currentStep === 'city') handleCitySubmit();
  };

  const handleCitySubmit = () => {
    const searchTerm = citySearch.trim().toLowerCase();
    const match = cities.find((c) =>
      c.name.toLowerCase().startsWith(searchTerm)
    );
    selectCity(match ? match.name : citySearch.trim());
  };

  /* ================================================================ */
  /*                         Rendering                                 */
  /* ================================================================ */
  const filteredCities = cities
    .filter((c) => c.name.toLowerCase().startsWith(citySearch.toLowerCase()))
    .slice(0, 6);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 bg-black rounded-3xl border-0 shadow-2xl z-[9999] fixed">
        {/* Header */}
        <DialogHeader className="px-4 py-3 bg-black text-white rounded-t-3xl">
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
            <div className="w-8 h-8" />
          </div>
        </DialogHeader>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                {msg.isBot && (
                  <img
                    src={chatbotAvatar}
                    alt="Event-Guide"
                    className="w-8 h-8 rounded-full mr-3 mt-1 object-cover"
                  />
                )}
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.isBot ? 'bg-gray-200 text-black' : 'bg-red-500 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <div
                    className={`text-xs text-gray-500 mt-1 ${
                      msg.isBot ? 'text-left' : 'text-right'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              {msg.hasButtons && msg.buttons && (
                <div className="flex flex-wrap gap-2 justify-start ml-2">
                  {msg.buttons.map((b, i) => (
                    <Button
                      key={i}
                      variant={b.variant || 'outline'}
                      size="sm"
                      onClick={b.action}
                      className={`text-xs ${
                        b.variant === 'default'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {b.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tippen-Animation */}
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

        {/* Input (Name oder Stadt) */}
        {(currentStep === 'name' || currentStep === 'city') && (
          <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
              {currentStep === 'city' && (
                <Search className="h-5 w-5 text-gray-400" />
              )}
              <Input
                value={currentStep === 'city' ? citySearch : inputMessage}
                onChange={(e) =>
                  currentStep === 'city'
                    ? setCitySearch(e.target.value)
                    : setInputMessage(e.target.value)
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  currentStep === 'city' ? 'Stadt eingeben…' : 'Dein Name…'
                }
                className="flex-1 bg-transparent border-0 text-black placeholder-gray-500 focus:ring-0 focus:outline-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={
                  isTyping ||
                  (currentStep === 'name'
                    ? !inputMessage.trim()
                    : !citySearch.trim())
                }
                className="bg-red-500 hover:bg-red-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* City-Suggestions */}
            {currentStep === 'city' &&
              citySearch.length > 0 &&
              filteredCities.length > 0 && (
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

        {/* Hidden File-Input für Avatar-Upload */}
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
