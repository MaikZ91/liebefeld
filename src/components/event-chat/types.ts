import { RefObject } from 'react';
import { UserProfile } from '@/types/chatTypes';

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
  timestamp?: string; // For storing the creation time
}

export interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void; // New prop for toggling to community view
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
}

// Local storage keys
export const CHAT_HISTORY_KEY = 'event-chat-history';
export const CHAT_QUERIES_KEY = 'event-chat-queries';

export interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  handleDateSelect: (date: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  examplePrompts: string[];
  handleExamplePromptClick: (prompt: string) => void;
}

export interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: string[];
  toggleRecentQueries: () => void;
  inputRef: RefObject<HTMLInputElement>;
  onAddEvent?: () => void;
}

export interface RecentQueriesProps {
  showRecentQueries: boolean;
  setShowRecentQueries: (show: boolean) => void;
  queriesToRender: string[];
  handleExamplePromptClick: (query: string) => void;
}

export interface ChatHeaderProps {
  activeChatModeValue: 'ai' | 'community';
  handleToggleChat: () => void;
  exportChatHistory: () => void;
  clearChatHistory: () => void;
}

export interface PersonalizationOptions {
  userProfile: UserProfile | null;
  currentUser: string | null;
  userService: any;
}
