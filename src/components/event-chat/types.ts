
export interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
  timestamp: string;
}

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
  handleSendMessage: (customInput?: string) => void;
  isTyping: boolean;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: string[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent?: () => void;
  activeChatMode?: 'ai' | 'community';
  onToggleChatMode?: () => void;
}

export interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void;
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
}

export interface ChatHeaderProps {
  activeChatModeValue: 'ai' | 'community';
  handleToggleChat: () => void;
  exportChatHistory: () => void;
  clearChatHistory: () => void;
}

export interface RecentQueriesProps {
  showRecentQueries: boolean;
  setShowRecentQueries: (show: boolean) => void;
  queriesToRender: string[];
  handleExamplePromptClick: (prompt: string) => void;
}

export interface PersonalizationOptions {
  userProfile: any;
  currentUser: string;
  userService: any;
}

export const CHAT_HISTORY_KEY = 'chatHistory';
export const CHAT_QUERIES_KEY = 'chatQueries';
