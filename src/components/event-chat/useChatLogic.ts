// src/components/event-chat/useChatLogic.ts

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EventShare } from '@/types/chatTypes';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  date?: Date;
  html?: string;
}

export interface UseChatLogicProps {
  isVisible?: boolean;
  initialMessages?: ChatMessage[];
}

export const useChatLogic = (events: any[], fullPage: boolean = false, activeChatMode: 'ai' | 'community' = 'ai') => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: `Hallo! Ich bin dein persönlicher Event-Assistent. Frag mich nach bevorstehenden Events, Kategorien oder lass dich einfach inspirieren.`,
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const examplePrompts = [
    "Zeige mir Events für heute",
    "Was ist am Wochenende los?",
    "Suche Sport-Events",
    "Finde Konzerte in der Nähe",
    "Events durchblättern",
    "Kulturelle Veranstaltungen",
    "Kostenlose Events"
  ];

  const { toast } = useToast();

  useEffect(() => {
    if (fullPage) {
      setIsVisible(true);
      setIsChatOpen(true);
    }
  }, [fullPage]);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!fullPage) {
      setIsVisible(!isVisible);
    }
  };

  const addToGlobalQueries = (query: string) => {
    setGlobalQueries(prevQueries => {
      const newQueries = [query, ...prevQueries.filter(q => q !== query)].slice(0, 5);
      localStorage.setItem('globalQueries', JSON.stringify(newQueries));
      return newQueries;
    });
  };

  useEffect(() => {
    const storedQueries = localStorage.getItem('globalQueries');
    if (storedQueries) {
      setGlobalQueries(JSON.parse(storedQueries));
    }
  }, []);

  const toggleRecentQueries = () => {
    setShowRecentQueries(!showRecentQueries);
  };

  const clearChatHistory = () => {
    setMessages([{
      id: 'welcome',
      text: `Hallo! Ich bin dein persönlicher Event-Assistent. Frag mich nach bevorstehenden Events, Kategorien oder lass dich einfach inspirieren.`,
      isUser: false,
    }]);
    toast({
      title: "Chat gelöscht!",
      description: "Der Chatverlauf wurde erfolgreich gelöscht.",
    })
  };

  const exportChatHistory = () => {
    const chatHistory = messages.map(msg => `${msg.isUser ? 'Du' : 'Bot'}: ${msg.text}`).join('\n');
    const blob = new Blob([chatHistory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chatverlauf.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDateSelect = (date: string) => {
    setInput(prevInput => prevInput + ' ' + date);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleExamplePromptClick = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleHeartClick = () => {
    setIsHeartActive(!isHeartActive);
  };

  // Diese Funktion wird nicht mehr direkt die Events filtern oder formatieren.
  // Sie dient nur noch als Wrapper für den Aufruf der Edge Function.
  const generateAIResponse = (userInput: string, availableEvents: any[]) => {
    // Die eigentliche Logik für die Filterung und Formatierung liegt jetzt in der Edge Function (ai-event-chat/index.ts)
    // Das Frontend übergibt einfach die gesamte Liste der verfügbaren Events und die Benutzeranfrage an die Edge Function.
    // Die Edge Function gibt dann den fertig formatierten HTML-Code zurück.
    
    // Wir benötigen hier keine komplexe Logik mehr, da die Edge Function alles übernimmt.
    // Das 'responseText' und 'relevantEvents' werden im Frontend nicht mehr direkt genutzt,
    // da die formatierte Antwort direkt von der Edge Function kommt.
    return userInput; // Der userInput wird einfach an die Edge Function weitergeleitet.
                      // Die Edge Function nutzt dann ihre eigene Logik, um die Events zu filtern
                      // und die Antwort zu generieren.
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
    };

    setMessages(prev => [...prev, newMessage]);
    addToGlobalQueries(input.trim());
    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // simulate processing time for realistic AI feel (kann hier entfernt werden, da Edge Function real ist)
      // await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // Direkter Aufruf der Edge Function (die die Logik von generateAIResponse enthält)
      // Der 'aiResponseText' kommt direkt von der Edge Function als HTML
      const { data, error } = await supabase.functions.invoke('ai-event-chat', {
          body: {
            query: userInput,
            timeOfDay: new Date().getHours() < 12 ? 'morning' : (new Date().getHours() < 18 ? 'afternoon' : 'evening'),
            weather: 'partly_cloudy', // Dies sollte durch eine echte Wetterabfrage ersetzt werden
            allEvents: events, // Die komplette Event-Liste an die Edge Function senden
            currentDate: new Date().toISOString().split('T')[0],
            nextWeekStart: new Date().toISOString().split('T')[0], // Beispielwerte, anpassen falls benötigt
            nextWeekEnd: new Date().toISOString().split('T')[0], // Beispielwerte, anpassen falls benötigt
            userInterests: JSON.parse(localStorage.getItem('user_interests') || '[]'), // Interessen übergeben
            userLocations: JSON.parse(localStorage.getItem('user_locations') || '[]'), // Orte übergeben
          }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        html: data.response, // Die Edge Function liefert direkt HTML
        isUser: false,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Anfrage. Bitte versuche es erneut.",
        isUser: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
    messages,
    input,
    setInput,
    isTyping,
    isVisible,
    isChatOpen,
    handleToggleChat,
    handleSendMessage,
    handleDateSelect,
    messagesEndRef,
    inputRef,
    examplePrompts,
    handleExamplePromptClick,
    handleKeyPress,
    globalQueries,
    showRecentQueries,
    toggleRecentQueries,
    isHeartActive,
    handleHeartClick,
    clearChatHistory,
    exportChatHistory,
  };
};