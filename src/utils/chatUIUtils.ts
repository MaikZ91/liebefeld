import { getCategoryColor } from './chatUIUtils';
import { fetchAllSuggestionsByCategory } from './suggestionUtils';

export const getActivitySuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening', 
  interest: string, 
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  // Get ALL suggestions for the category
  const suggestions = await fetchAllSuggestionsByCategory(timeOfDay, interest, weather);
  
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
    return arrayCopy;
  };
  
  // Shuffle and limit to 4 suggestions, prioritizing suggestions with links
  const shuffledWithLinks = shuffleArray(suggestions)
    .filter(suggestion => suggestion.link)
    .slice(0, 2);
  
  const shuffledWithoutLinks = shuffleArray(suggestions)
    .filter(suggestion => !suggestion.link)
    .slice(0, 2);
  
  return [...shuffledWithLinks, ...shuffledWithoutLinks];
};

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

export const getAllSuggestionsByCategory = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening', 
  interest: string, 
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  // Get all suggestions for the category without weather filtering
  return fetchAllSuggestionsByCategory(timeOfDay, interest, weather);
};
