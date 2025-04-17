
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

export const getRandomAvatar = () => {
  const seed = Math.random().toString(36).substring(2, 8);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    'Ausgehen': 'bg-purple-500 text-white hover:bg-purple-600',
    'Sport': 'bg-green-500 text-white hover:bg-green-600',
    'Kreativität': 'bg-amber-500 text-white hover:bg-amber-600',
    'default': 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };
  
  return categoryColors[category] || categoryColors.default;
};

import { fetchAllSuggestionsByCategory, fetchSuggestions } from './suggestionUtils';

export const getActivitySuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening', 
  interest: string, 
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  const suggestions = await fetchSuggestions(timeOfDay, interest, weather);
  
  if (suggestions.length === 0) {
    console.log("No suggestions found for the provided criteria", { timeOfDay, interest, weather });
    return [];
  }
  
  const shuffleArray = (array: Array<{ activity: string; link?: string | null }>) => {
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    // Return more suggestions to ensure variety
    return arrayCopy.slice(0, Math.min(arrayCopy.length, 8));
  };
  
  return shuffleArray([...suggestions]);
};

export const getAllSuggestionsByCategory = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening', 
  interest: string, 
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  return fetchAllSuggestionsByCategory(timeOfDay, interest, weather);
};
