// src/components/event-chat/types.ts
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
  isEventNotification?: boolean;
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
  price?: string;
  location: string;
  image_url: string;
  category: string;
  link?: string; 
  likes?: number;
  liked_by_users?: Array<{
    username: string;
    avatar_url?: string | null;
    timestamp: string;
  }>;
  description?: string;
  rsvp_yes?: number;
  rsvp_maybe?: number;
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
  setInput: (value: string) => void;
  // This signature is flexible to accept string content or event data
  handleSendMessage: (content?: string | any) => Promise<void>; 
  isTyping: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: any[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent?: () => void; // This is a simple function to trigger the modal
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
  // This handler will receive the standardized `handleSendMessage` from useMessageSending/useChatLogic
  onExternalSendHandlerChange?: (handler: ((content?: string | any) => Promise<void>) | null) => void; 
}