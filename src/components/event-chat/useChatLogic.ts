// src/components/event-chat/useChatLogic.ts
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, CHAT_HISTORY_KEY, CHAT_QUERIES_KEY, PanelEventData, PanelEvent, AdEvent } from './types';
import { supabase } from '@/integrations/supabase/client';
import { generateResponse, getWelcomeMessage, createResponseHeader } from '@/utils/chatUtils';
import { toast } from 'sonner';

import { Event } from '@/types/eventTypes';
import { getFutureEvents, getEventsForDay, getWeekRange } from '@/utils/eventUtils';
import { fetchWeather } from '@/utils/weatherUtils'; // Importiere fetchWeather

export const useChatLogic = (
  events: any[],
  fullPage: boolean = false,
  activeChatModeValue: 'ai' | 'community' = 'ai'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(fullPage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeMessageShownRef = useRef(false);
  
  const examplePrompts = [
    "Welche Events gibt es heute?",
    "Was kann ich am Wochenende machen?",
    "Gibt es Konzerte im Lokschuppen?"
  ];

  const adEvents: AdEvent[] = [
    {
      title: 'Tribe Creative Circle',
      date: 'Immer am letzten Freitag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/83f7c05b-0e56-4f3c-a19c-adeab5429b59.jpg',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event"
    },
    {
      title: 'Tribe Kennenlernabend',
      date: 'Immer am letzten Sonntag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event"
    },
    {
      title: 'Hör dir die Tribe Playlist an!',
      date: 'Jederzeit',
      location: 'Spotify',
      imageUrl: '/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png',
      link: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      type: "music"
    },
    {
      title: 'Ihre Anzeige hier! Erreichen Sie Ihr Zielpublikum.',
      date: 'Maßgeschneiderte Lösungen',
      location: 'Kontaktieren Sie uns jetzt!',
      imageUrl: '/lovable-uploads/placeholder-ad.png',
      link: "mailto:mschach@googlemail.com",
      type: "sponsored-ad"
    }
  ];

  const createPanelData = (filteredEvents: Event[]): PanelEventData => {
    const allItems: (PanelEvent | AdEvent)[] = [];

    filteredEvents.slice(0, 5).forEach(event => {
      allItems.push({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        price: event.is_paid ? "Kostenpflichtig" : "Kostenlos",
        location: event.location,
        image_url: event.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
        category: event.category
      });
    });

    if (adEvents.length > 0) {
      const randomAd = adEvents[Math.floor(Math.random() * adEvents.length)];
      
      const insertIndex = allItems.length >= 2 ? Math.floor(Math.random() * (allItems.length - 2 + 1)) + 2 : allItems.length;
      
      allItems.splice(insertIndex, 0, randomAd);
      console.log('Adding random ad to panel at index', insertIndex, ':', randomAd.title);
    }

    return {
      events: allItems,
      currentIndex: 0
    };
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  };

  const handleSendMessage = async (customInput?: string) => {
    const message = customInput || input;
    if (!message.trim()) return;
    
    updateRecentQueries(message);
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      isUser: true,
      text: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const lowercaseMessage = message.toLowerCase().trim();

    // NEU: Spezifische Abfrage für "Perfekter Tag" abfangen
    if (lowercaseMessage === "mein perfekter tag in liebefeld") {
      console.log('[useChatLogic] "Mein Perfekter Tag in Liebefeld" Anfrage erkannt.');
      try {
        const weather = await fetchWeather(); // Wetter abrufen
        const today = new Date().toISOString().split('T')[0];

        // Daten für die Edge Function vorbereiten
        // Hier müsste die Edge Function auch auf die Interessen/Orte zugreifen
        // Die generate-perfect-day Edge Function ist bereits so angepasst,
        // dass sie diese Parameter akzeptiert.
        const currentUserProfile = await supabase.from('user_profiles')
          .select('*')
          .eq('username', localStorage.getItem('community_chat_username')) // Annahme, dass der Username hier gespeichert ist
          .single();

        const interests = currentUserProfile.data?.interests || [];
        const favorite_locations = currentUserProfile.data?.favorite_locations || [];

        const { data, error } = await supabase.functions.invoke('generate-perfect-day', {
          body: {
            weather: weather,
            username: localStorage.getItem('community_chat_username'), // Benutzername übergeben
            interests: interests, // Interessen übergeben
            favorite_locations: favorite_locations // Lieblingsorte übergeben
          }
        });

        if (error) {
          console.error('[useChatLogic] Error calling generate-perfect-day edge function:', error);
          throw new Error(`Edge function error: ${error.message}`);
        }

        const botMessage: ChatMessage = {
          id: `bot-perfect-day-${Date.now()}`,
          isUser: false,
          text: 'Hier ist dein perfekter Tag in Liebefeld!',
          html: data.response || data.message || "Entschuldige, ich konnte deinen perfekten Tag nicht generieren.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);

      } catch (error) {
        console.error('[useChatLogic] Error generating perfect day:', error);
        const errorMessage: ChatMessage = {
          id: `error-perfect-day-${Date.now()}`,
          isUser: false,
          text: 'Es tut mir leid, ich konnte deinen perfekten Tag nicht generieren.',
          html: `${createResponseHeader("Fehler")}
          <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
            Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
            Bitte versuche es später noch einmal.
          </div>`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
      return; // Beende die Funktion hier, damit die Standard-KI-Antwort nicht ausgelöst wird
    }

    // ... (bestehender Code für Event-Filterung und AI-Antwort)
    let relevantEvents: Event[] = [];
    const currentDate = new Date();

    if (lowercaseMessage.includes('heute') || lowercaseMessage.includes('today')) {
      relevantEvents = getEventsForDay(events, currentDate);
    } else if (lowercaseMessage.includes('morgen') || lowercaseMessage.includes('tomorrow')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      relevantEvents = getEventsForDay(events, tomorrow);
    }
     else if (lowercaseMessage.includes('wochenende') || lowercaseMessage.includes('weekend')) {
      const [startOfWeek, endOfWeek] = getWeekRange(currentDate);
      let saturday = new Date(currentDate);
      let sunday = new Date(currentDate);

      saturday.setDate(currentDate.getDate() + (6 - currentDate.getDay() + 7) % 7);
      sunday.setDate(currentDate.getDate() + (0 - currentDate.getDay() + 7) % 7);

      if (saturday < currentDate) {
          saturday.setDate(saturday.getDate() + 7);
      }
      if (sunday < currentDate) {
          sunday.setDate(sunday.getDate() + 7);
      }
      
      relevantEvents = events.filter(e => 
        (new Date(e.date).toISOString().split('T')[0] === saturday.toISOString().split('T')[0]) ||
        (new Date(e.date).toISOString().split('T')[0] === sunday.toISOString().split('T')[0])
      );
    }
     else {
      relevantEvents = getFutureEvents(events);
    }
    
    const categoryMapping = {
      konzert: "Konzert",
      party: "Party",
      ausstellung: "Ausstellung",
      sport: "Sport",
      workshop: "Workshop",
      kultur: "Kultur",
      film: "Film",
      theater: "Theater",
      lesung: "Lesung",
      festival: "Festival"
    };

    let detectedCategory: string | null = null;
    for (const [keyword, category] of Object.entries(categoryMapping)) {
      if (lowercaseMessage.includes(keyword)) {
        detectedCategory = category;
        break;
      }
    }

    if (detectedCategory) {
      relevantEvents = relevantEvents.filter(event => event.category && event.category.toLowerCase() === detectedCategory.toLowerCase());
    }
    
    const panelMessage: ChatMessage = {
      id: `panel-${Date.now()}`,
      isUser: false,
      text: 'Hier sind einige Events für dich:',
      panelData: createPanelData(relevantEvents),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, panelMessage]);
    
    try {
      const responseHtml = await generateResponse(message, events, isHeartActive);
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        isUser: false,
        text: 'Hier sind weitere Details zu den Events.',
        html: responseHtml,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('[useChatLogic] Error generating response:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        isUser: false,
        text: 'Es tut mir leid, ich konnte deine Anfrage nicht verarbeiten.',
        html: `${createResponseHeader("Fehler")}
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
          Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
          Bitte versuche es später noch einmal oder formuliere deine Anfrage anders.
        </div>`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // ... (restlicher Code bleibt unverändert)