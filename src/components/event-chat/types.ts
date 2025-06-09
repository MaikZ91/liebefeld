
export interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
  timestamp: string;
  showEventSwiper?: boolean;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  handleDateSelect: (date: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  examplePrompts: string[];
  handleExamplePromptClick: (prompt: string) => void;
}

export interface ChatHeaderProps {
  activeChatModeValue: 'ai' | 'community';
  handleToggleChat: () => void;
  exportChatHistory: () => void;
  clearChatHistory: () => void;
}

export interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: string[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent?: () => void;
}

export interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void;
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
  hideButtons?: boolean;
}

export interface RecentQueriesProps {
  showRecentQueries: boolean;
  setShowRecentQueries: (show: boolean) => void;
  queriesToRender: string[];
  handleExamplePromptClick: (query: string) => void;
}

export interface PersonalizationOptions {
  userProfile: any;
  currentUser: string;
  userService: any;
}

export const CHAT_HISTORY_KEY = 'chat_history';
export const CHAT_QUERIES_KEY = 'chat_queries';
