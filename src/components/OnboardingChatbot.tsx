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

const chatbotAvatar =
  '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png';

/* ------------------------------------------------------------------ */
/* Anonym anmelden + Profil-Stub (user_profiles) sicherstellen         */
/* ------------------------------------------------------------------ */
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
    .upsert({ id: uid, onboarding_steps: [] }, { onConflict: 'id' });
};

/* ------------------------------------------------------------------ */
/* Tracking-Step in onboarding_steps anhängen                          */
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

  /* ▼ RPC als any casten, damit TS nicht meckert */
  await (supabase as any).rpc('append_onboarding_step_jsonb', {
    uid: userId,
    new_step: payload,
  });
};

/* ================================================================== */

interface OnboardingChatbotProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
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

type Step =
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
  const [step, setStep] = useState<Step>('start');
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

  /* ---------------- Dialog öffnet ---------------- */
  useEffect(() => {
    if (open && messages.length === 0) {
      addBotMessage(
        'Hey du! Willkommen bei THE TRIBE. Ich bin Mia, deine Event-Assistentin. Bereit?',
        true,
        [
          {
            text: "Los geht's! 🚀",
            action: startOnboarding,
            variant: 'default',
          },
        ]
      );
    }
  }, [open, messages.length]);

  /* ---------------- Auto-Scroll ------------------ */
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
      setMessages((p) => [
        ...p,
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
    }, 700);
  };

  const addUserMessage = (msg: string) => {
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        sender: userData.username || 'Du',
        message: msg,
        timestamp: new Date(),
        isBot: false,
      },
    ]);
    setInputMessage('');
  };

  const rebuildInterestButtons = (current: string[]) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.hasButtons && m.message.includes('interessiert')
          ? {
              ...m,
              buttons: [
                ...interests.map((i) => ({
                  text: `${i.emoji} ${i.text}`,
                  action: () => toggleInterest(i.text),
                  variant: current.includes(i.text) ? 'default' : 'outline',
                })),
                {
                  text: 'Weiter →',
                  action: proceedToAvatar,
                  variant: 'default',
                },
              ],
            }
          : m
      )
    );
  };

  /* ================================================================ */
  /*                       Onboarding-Flow                            */
  /* ================================================================ */

  const startOnboarding = async () => {
    await initAnonUser();
    setIsTyping(true);
    setStep('name');
    await trackStep('onboarding_started', null, true);
    addBotMessage('Wie möchtest du genannt werden?');
  };

  const handleNameSubmit = async () => {
    if (!inputMessage.trim()) return;
    const name = inputMessage.trim();
    setUserData((p) => ({ ...p, username: name }));
    addUserMessage(name);
    await trackStep('name_entered', name);

    setIsTyping(true);
    setStep('city');
    addBotMessage('In welcher Stadt bist du unterwegs?');
  };

  const selectCity = (city: string) => {
    const abbr =
      cities.find((c) => c.name.toLowerCase() === city.toLowerCase())?.abbr ??
      city.toLowerCase().replace(/[^a-z]/g, '');

    setUserData((p) => ({ ...p, city }));
    setSelectedCity(abbr);
    addUserMessage(city);

    setIsTyping(true);
    setStep('interests');
    setCitySearch('');
    rebuildInterestButtons(userData.interests);
    addBotMessage('Was interessiert dich besonders?', true);
  };

  const toggleInterest = (interest: string) => {
    setUserData((p) => {
      const current = p.interests.includes(interest)
        ? p.interests.filter((i) => i !== interest)
        : [...p.interests, interest];
      rebuildInterestButtons(current);
      return { ...p, interests: current };
    });
  };

  const proceedToAvatar = async () => {
    await trackStep('interests_submitted', userData.interests);
    if (userData.interests.length)
      addUserMessage(`Ausgewählt: ${userData.interests.join(', ')}`);

    setIsTyping(true);
    setStep('avatar');
    addBotMessage(
      'Möchtest du ein Profilbild hinzufügen?',
      true,
      [
        { text: 'Bild hochladen', action: () => fileInputRef.current?.click(), variant: 'default' },
        { text: 'Überspringen', action: proceedToNotifications, variant: 'outline' },
      ]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await userService.uploadProfileImage(file);
      setUserData((p) => ({ ...p, avatar: url }));
      await trackStep('avatar_uploaded', 'yes');
      addUserMessage('Profilbild hochgeladen ✓');
      proceedToNotifications();
    } catch {
      toast({
        title: 'Fehler',
        description: 'Bild-Upload fehlgeschlagen',
        variant: 'destructive',
      });
    }
  };

  const proceedToNotifications = () => {
    setIsTyping(true);
    setStep('notifications');
    addBotMessage('Darf ich dir Events vorschlagen, die zu dir passen?', true, [
      { text: 'Ja klar!', action: () => enableNotifications(true), variant: 'default' },
      { text: 'Später vielleicht', action: () => enableNotifications(false), variant: 'outline' },
    ]);
  };

  const enableNotifications = (ok: boolean) => {
    setUserData((p) => ({ ...p, wantsNotifications: ok }));
    addUserMessage(ok ? 'Ja klar!' : 'Später vielleicht');
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    await trackStep('onboarding_completed');
    setIsTyping(true);
    setStep('complete');

    try {
      await userService.createOrUpdateProfile({
        username: userData.username,
        avatar: userData.avatar || null,
        interests: userData.interests,
        favorite_locations: userData.city ? [userData.city] : [],
        hobbies: [],
      });

      localStorage.setItem(USERNAME_KEY, userData.username);
      if (userData.avatar) localStorage.setItem(AVATAR_KEY, userData.avatar);

      addBotMessage(
        `Du bist bereit! 🎉 Ich finde jetzt passende Events für dich in ${userData.city}.`,
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
        description: 'Dein Profil wurde gespeichert.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  /* ---------------- Input-Handling ---------------- */
  const handleSend = () => {
    if (step === 'name') handleNameSubmit();
    if (step === 'city') handleCitySubmit();
  };

  const handleCitySubmit = () => {
    const term = citySearch.trim().toLowerCase();
    const match = cities.find((c) => c.name.toLowerCase().startsWith(term));
    selectCity(match ? match.name : citySearch.trim());
  };

  /* ---------------- Render ------------------------ */
  const filteredCities = cities
    .filter((c) => c.name.toLowerCase().startsWith(citySearch.toLowerCase()))
    .slice(0, 6);

  const fmt = (d: Date) =>
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 bg-black rounded-3xl">
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
            <DialogTitle className="text-white font-bold text-base">
              THE TRIBE ONBOARDING
            </DialogTitle>
            <div className="w-8 h-8" />
          </div>
        </DialogHeader>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                {m.isBot && (
                  <img
                    src={chatbotAvatar}
                    alt="Event-Guide"
                    className="w-8 h-8 rounded-full mr-3 mt-1 object-cover"
                  />
                )}
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      m.isBot ? 'bg-gray-200 text-black' : 'bg-red-500 text-white'
                    }`}
                  >
                    <p className="text-sm">{m.message}</p>
                  </div>
                  <div
                    className={`text-xs text-gray-500 mt-1 ${
                      m.isBot ? 'text-left' : 'text-right'
                    }`}
                  >
                    {fmt(m.timestamp)}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              {m.hasButtons && m.buttons && (
                <div className="flex flex-wrap gap-2 justify-start ml-2">
                  {m.buttons.map((b, i) => (
                    <Button
                      key={i}
                      variant={b.variant}
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

          {/* Typing */}
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

        {/* Input */}
        {(step === 'name' || step === 'city') && (
          <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
              {step === 'city' && <Search className="h-5 w-5 text-gray-400" />}
              <Input
                value={step === 'city' ? citySearch : inputMessage}
                onChange={(e) =>
                  step === 'city'
                    ? setCitySearch(e.target.value)
                    : setInputMessage(e.target.value)
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={step === 'city' ? 'Stadt eingeben…' : 'Dein Name…'}
                className="flex-1 bg-transparent border-0 text-black placeholder-gray-500 focus:ring-0"
              />
              <Button
                onClick={handleSend}
                disabled={
                  isTyping ||
                  (step === 'name' ? !inputMessage.trim() : !citySearch.trim())
                }
                className="bg-red-500 hover:bg-red-600 text-white rounded-full h-10 w-10"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* City-Suggestions */}
            {step === 'city' &&
              citySearch &&
              filteredCities.length > 0 && (
                <div className="mt-3 space-y-2">
                  {filteredCities.map((c) => (
                    <Button
                      key={c.abbr}
                      variant="outline"
                      size="sm"
                      onClick={() => selectCity(c.name)}
                      className="w-full justify-start text-left border-gray-300 hover:bg-gray-100"
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* verstecktes File-Input */}
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
