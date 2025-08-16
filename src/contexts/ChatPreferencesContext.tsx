import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CHAT_PREFERENCES_KEY = 'communityChat_preferences';

export interface ChatPreferences {
  activeCategory: string;
  lastActivity: number;
}

const DEFAULT_PREFERENCES: ChatPreferences = {
  activeCategory: 'alle',
  lastActivity: Date.now()
};

interface ChatPreferencesContextProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const ChatPreferencesContext = createContext<ChatPreferencesContextProps | undefined>(undefined);

export const ChatPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCategory, setActiveCategoryState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(CHAT_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('ChatPreferencesProvider: loaded stored category =', parsed.activeCategory);
        return parsed.activeCategory || 'alle';
      }
    } catch (error) {
      console.error('ChatPreferencesProvider: error loading category:', error);
    }
    console.log('ChatPreferencesProvider: using default category = alle');
    return 'alle';
  });

  const setActiveCategory = (category: string) => {
    console.log('ChatPreferencesProvider: changing category to:', category);
    setActiveCategoryState(category);
    
    // Save to localStorage
    try {
      const current = localStorage.getItem(CHAT_PREFERENCES_KEY);
      const currentData = current ? JSON.parse(current) : {};
      const updated = {
        ...currentData,
        activeCategory: category,
        lastActivity: Date.now()
      };
      localStorage.setItem(CHAT_PREFERENCES_KEY, JSON.stringify(updated));
      console.log('ChatPreferencesProvider: saved category to localStorage:', category);
    } catch (error) {
      console.error('ChatPreferencesProvider: error saving category:', error);
    }
  };

  return (
    <ChatPreferencesContext.Provider 
      value={{
        activeCategory,
        setActiveCategory
      }}
    >
      {children}
    </ChatPreferencesContext.Provider>
  );
};

export const useChatPreferences = () => {
  const context = useContext(ChatPreferencesContext);
  if (context === undefined) {
    throw new Error('useChatPreferences must be used within a ChatPreferencesProvider');
  }
  return context;
};