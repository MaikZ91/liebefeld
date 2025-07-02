// File: src/components/event-chat/types.ts
import { LandingSlideData } from './SwipeableLandingPanel';

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  html?: string;
  timestamp: string;
  panelData?: PanelEventData;
  slideData?: LandingSlideData; 
  examplePrompts?: string[]; 
  isEventNotification?: boolean; // NEW: Flag for event notifications
}

export interface PanelEventData {
  events: (PanelEvent | AdEvent)[]; 
  currentIndex: number;
}

export interface PanelEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  price?: string; // Made optional since events from DB don't always have price
  location: string;
  image_url: string;
  category: string;
  link?: string; 
  likes?: number; // Added likes property
  description?: string; // Added description for completeness
  rsvp_yes?: number; // Added RSVP data
  rsvp_maybe?: number; // Added RSVP data
}

export interface AdEvent {
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  link?: string;
  type?: string; 
}

export interface EventChatBotProps {
  fullPage?: boolean;
  onAddEvent?: () => void;
  onToggleCommunity?: () => void; 
  activeChatMode?: 'ai' | 'community';
  setActiveChatMode?: (mode: 'ai' | 'community') => void;
  hideButtons?: boolean;
}

// Local storage keys
export const CHAT_HISTORY_KEY = 'event-chat-history';
export const CHAT_QUERIES_KEY = 'event-chat-queries';

export interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onAddEvent?: () => void;
  handleDateSelect: (date: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  examplePrompts: string[];
  handleExamplePromptClick: (prompt: string) => void;
}

export interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  // Updated signature to accept optional content argument
  handleSendMessage: (content?: string | any) => Promise<void>; 
  isTyping: boolean;
  // Updated event types for HTMLInputElement as ChatInput uses <input>
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; 
  // Updated event types for HTMLInputElement as ChatInput uses <input>
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: any[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent?: () => void;
  showAnimatedPrompts: boolean;
  activeChatModeValue: 'ai' | 'community';
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
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
  userProfile: any | null; 
  currentUser: string | null;
  userService: any;
}

export interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  onAddEvent?: () => void;
  hideButtons?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideInput?: boolean;
  externalInput?: string;
  setExternalInput?: (value: string) => void;
  onExternalSendHandlerChange?: (handler: (() => void) | null) => void;
}
