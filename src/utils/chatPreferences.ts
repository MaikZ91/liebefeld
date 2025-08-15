// Chat preferences utilities for localStorage
const CHAT_PREFERENCES_KEY = 'communityChat_preferences';

export interface ChatPreferences {
  activeCategory: string;
  lastActivity: number;
}

const DEFAULT_PREFERENCES: ChatPreferences = {
  activeCategory: 'Ausgehen',
  lastActivity: Date.now()
};

export const getChatPreferences = (): ChatPreferences => {
  try {
    const stored = localStorage.getItem(CHAT_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Error loading chat preferences:', error);
  }
  return DEFAULT_PREFERENCES;
};

export const saveChatPreferences = (preferences: Partial<ChatPreferences>) => {
  try {
    const current = getChatPreferences();
    const updated = {
      ...current,
      ...preferences,
      lastActivity: Date.now()
    };
    localStorage.setItem(CHAT_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving chat preferences:', error);
  }
};

export const saveActiveCategory = (category: string) => {
  saveChatPreferences({ activeCategory: category });
};

export const getActiveCategory = (): string => {
  return getChatPreferences().activeCategory;
};