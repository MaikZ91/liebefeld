
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

  // Function to generate intelligent AI responses based on user input and available events
  const generateAIResponse = (userInput: string, availableEvents: any[]) => {
    const input = userInput.toLowerCase();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Filter events based on user query
    let relevantEvents = availableEvents || [];
    let responseText = "";
    
    if (input.includes('heute') || input.includes('today')) {
      relevantEvents = availableEvents.filter(event => event.date === todayString);
      responseText = `Für heute (${today.toLocaleDateString('de-DE')}) habe ich ${relevantEvents.length} Events gefunden:`;
    } else if (input.includes('wochenende') || input.includes('weekend')) {
      const weekend = [];
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + (6 - today.getDay()));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      
      const satString = saturday.toISOString().split('T')[0];
      const sunString = sunday.toISOString().split('T')[0];
      
      relevantEvents = availableEvents.filter(event => 
        event.date === satString || event.date === sunString
      );
      responseText = `Am Wochenende sind ${relevantEvents.length} Events geplant:`;
    } else if (input.includes('sport')) {
      relevantEvents = availableEvents.filter(event => 
        event.category?.toLowerCase().includes('sport') || 
        event.title?.toLowerCase().includes('sport') ||
        event.description?.toLowerCase().includes('sport')
      );
      responseText = `Ich habe ${relevantEvents.length} Sport-Events gefunden:`;
    } else if (input.includes('konzert') || input.includes('musik') || input.includes('music')) {
      relevantEvents = availableEvents.filter(event => 
        event.category?.toLowerCase().includes('konzert') || 
        event.category?.toLowerCase().includes('musik') ||
        event.title?.toLowerCase().includes('konzert') ||
        event.title?.toLowerCase().includes('musik')
      );
      responseText = `Hier sind ${relevantEvents.length} Musik-Events:`;
    } else if (input.includes('kultur') || input.includes('art')) {
      relevantEvents = availableEvents.filter(event => 
        event.category?.toLowerCase().includes('kultur') || 
        event.category?.toLowerCase().includes('kunst') ||
        event.category?.toLowerCase().includes('galerie') ||
        event.title?.toLowerCase().includes('kunst')
      );
      responseText = `Diese ${relevantEvents.length} kulturellen Veranstaltungen finden statt:`;
    } else if (input.includes('kostenlos') || input.includes('gratis') || input.includes('free')) {
      relevantEvents = availableEvents.filter(event => 
        event.price === 'Kostenlos' || 
        event.price === '0€' ||
        event.description?.toLowerCase().includes('kostenlos')
      );
      responseText = `${relevantEvents.length} kostenlose Events sind verfügbar:`;
    } else {
      // General response with a sample of events
      relevantEvents = availableEvents.slice(0, 10);
      responseText = `Hier sind einige Events, die dich interessieren könnten (${availableEvents.length} Events insgesamt verfügbar):`;
    }

    // Create a brief list of the most relevant events
    if (relevantEvents.length > 0) {
      const eventList = relevantEvents.slice(0, 3).map(event => {
        const date = new Date(event.date).toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit'
        });
        return `• ${event.title} - ${date} um ${event.time}`;
      }).join('\n');
      
      const moreEvents = relevantEvents.length > 3 ? `\n\n...und ${relevantEvents.length - 3} weitere Events. Swipe durch die Events oben um mehr zu sehen!` : '';
      
      return responseText + '\n\n' + eventList + moreEvents;
    } else {
      return responseText + '\n\nLeider wurden keine passenden Events gefunden. Schau dir die verfügbaren Events im Swiper an oder versuche eine andere Suche.';
    }
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
      // Simulate processing time for realistic AI feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate intelligent AI response
      const aiResponseText = generateAIResponse(userInput, events);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
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
