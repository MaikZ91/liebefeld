import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateResponse } from '@/utils/chatUtils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { EventShare, Message } from './types';

export const useChatLogic = (events: any[], fullPage = false, activeChatMode = 'ai') => {
  const [isVisible, setIsVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [globalQueries, setGlobalQueries] = useState<string[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isHeartActive, setIsHeartActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFirstRun, setIsFirstRun] = useState(true);
  const { toast } = useToast();

  const examplePrompts = [
    "Was gibt es heute in Liebefeld?",
    "Welche Events sind diese Woche?",
    "Veranstaltungen für Familien",
    "Konzerte am Wochenende",
    "❤️ Finde Events, die zu meinen Interessen passen"
  ];

  // Function to handle sending messages
  const handleSendMessage = useCallback(async (overrideInput?: string) => {
    const messageToSend = overrideInput !== undefined ? overrideInput : input;
    if (!messageToSend.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      type: 'user'
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');

    setIsTyping(true);
    try {
      const response = await generateResponse(messageToSend, events, isHeartActive);
      if (response) {
        // Add bot response to chat
        const botMessage: Message = {
          id: Date.now().toString(),
          content: response,
          type: 'bot'
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);

        // Save the query to recent queries
        setGlobalQueries(prevQueries => {
          const newQueries = [messageToSend, ...prevQueries.filter(q => q !== messageToSend)].slice(0, 5);
          return newQueries;
        });
      }
    } catch (error: any) {
      console.error("Error generating response:", error);
      toast({
        title: "Fehler",
        description: "Es ist ein Fehler aufgetreten. Bitte versuche es später noch einmal.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  }, [events, input, isHeartActive, toast]);

  // Function to handle date selection
  const handleDateSelect = (date: string) => {
    const formattedDate = format(new Date(date), 'EEEE, d. MMMM', { locale: de });
    setInput(`Veranstaltungen am ${formattedDate}`);
    if (inputRef.current) {
      inputRef.current?.focus();
    }
  };

  // Function to handle example prompt click
  const handleExamplePromptClick = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current?.focus();
    }
  };

  // Function to handle key press (Enter to send)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Function to toggle chat visibility
  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Function to toggle heart mode
  const handleHeartClick = () => {
    setIsHeartActive(!isHeartActive);
  };

  // Function to toggle recent queries visibility
  const toggleRecentQueries = () => {
    setShowRecentQueries(!showRecentQueries);
  };

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('chat_messages');
    toast({
      title: "Chat gelöscht",
      description: "Der Chatverlauf wurde erfolgreich gelöscht.",
    });
  };

  // Function to export chat history
  const exportChatHistory = () => {
    const chatHistory = messages.map(message => `${message.type === 'user' ? 'Du' : 'Bot'}: ${message.content}`).join('\n');
    const blob = new Blob([chatHistory], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chatverlauf.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Initialize messages with no welcome message as we're handling it in the MessageList component now
  useEffect(() => {
    if (isFirstRun) {
      setIsFirstRun(false);
      
      // Don't add a welcome message here anymore, as it's handled in MessageList.tsx
      // when there are no messages
      
      // Load saved messages from localStorage
      try {
        const savedMessages = localStorage.getItem('chat_messages');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
  }, [isFirstRun]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  return {
    isVisible,
    isChatOpen,
    messages,
    input,
    setInput,
    isTyping,
    globalQueries,
    showRecentQueries,
    setShowRecentQueries,
    messagesEndRef,
    inputRef,
    examplePrompts,
    isHeartActive, 
    handleSendMessage,
    handleDateSelect,
    handleExamplePromptClick,
    handleKeyPress,
    handleToggleChat,
    handleHeartClick,
    toggleRecentQueries,
    clearChatHistory,
    exportChatHistory
  };
};
