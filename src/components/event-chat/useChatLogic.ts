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
    "Events durchblättern", // Neuer Prompt für Event-Swiper
    "Kulturelle Veranstaltungen",
    "Kostenlose Events"
  ];

  const { toast } = useToast();

  useEffect(() => {
    if (fullPage) {
      setIsVisible(true);
    }
  }, [fullPage]);

  const handleToggleChat = () => {
    setIsVisible(!isVisible);
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
    };

    setMessages(prev => [...prev, newMessage]);
    addToGlobalQueries(input.trim());
    setInput('');
    setIsTyping(true);

    try {
      // Check if message is about events and should trigger swiper
      const isEventQuery = input.toLowerCase().includes('event') || 
                          input.toLowerCase().includes('veranstaltung') ||
                          input.toLowerCase().includes('durchblättern');
      
      let botResponse = "Entschuldigung, ich konnte keine passende Antwort finden.";
      
      if (isEventQuery) {
        botResponse = "Hier sind die aktuellen Events in deiner Umgebung. Du kannst durch sie durchswipen:";
      } else {
        // Simulate a bot response
        await new Promise(resolve => setTimeout(resolve, 1000));
        botResponse = `Ich habe deine Nachricht erhalten: "${input}".`;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
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
