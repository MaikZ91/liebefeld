// Chat preferences utilities for localStorage
const CHAT_PREFERENCES_KEY = 'communityChat_preferences';

export interface ChatPreferences {
  activeCategory: string;
  lastActivity: number;
}

const DEFAULT_PREFERENCES: ChatPreferences = {
  activeCategory: 'Alle',
  lastActivity: Date.now()
};

export const getChatPreferences = (): ChatPreferences => {
  try {
    const stored = localStorage.getItem(CHAT_PREFERENCES_KEY);
    console.log('getChatPreferences: stored =', stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('getChatPreferences: parsed =', parsed);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Error loading chat preferences:', error);
  }
  console.log('getChatPreferences: returning default =', DEFAULT_PREFERENCES);
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
    console.log('saveChatPreferences: saving =', updated);
    localStorage.setItem(CHAT_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving chat preferences:', error);
  }
};

export const saveActiveCategory = (category: string) => {
  console.log('saveActiveCategory: category =', category);
  saveChatPreferences({ activeCategory: category });
};

export const getActiveCategory = (): string => {
  const result = getChatPreferences().activeCategory;
  console.log('getActiveCategory: result =', result);
  return result;
};