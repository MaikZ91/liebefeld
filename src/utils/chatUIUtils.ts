
/**
 * Get initials from a name string
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

/**
 * Generate a random avatar URL
 */
export const getRandomAvatar = (): string => {
  const avatarStyles = ['adventurer', 'adventurer-neutral', 'avataaars', 'big-smile', 'bottts', 'croodles', 'fun-emoji'];
  const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  const randomSeed = Math.floor(Math.random() * 1000).toString();
  
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
};

/**
 * Get activity suggestions based on time of day, interest, and weather
 */
export const getActivitySuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  try {
    // Fetch a limited set (max 4) of suggestions from the suggestion utils
    const { fetchSuggestions } = await import('@/utils/suggestionUtils');
    const allSuggestions = await fetchSuggestions(timeOfDay, interest, weather);
    
    // Return max 4 suggestions
    return allSuggestions.slice(0, 4);
  } catch (error) {
    console.error('Error getting activity suggestions:', error);
    return [];
  }
};

/**
 * Get all suggestions for a category
 */
export const getAllSuggestionsByCategory = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  try {
    // Fetch all suggestions for the category from the suggestion utils
    const { fetchAllSuggestionsByCategory } = await import('@/utils/suggestionUtils');
    return await fetchAllSuggestionsByCategory(timeOfDay, interest, weather);
  } catch (error) {
    console.error('Error getting all suggestions:', error);
    return [];
  }
};

/**
 * Generate perfect day response
 */
export const generatePerfectDayResponse = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  weather: string,
  interests: string[]
): Promise<string> => {
  try {
    // Create a tailored response based on time of day, weather and interests
    const timeText = timeOfDay === 'morning' ? 'Morgen' : 
                    timeOfDay === 'afternoon' ? 'Nachmittag' : 'Abend';
    
    const weatherText = weather === 'sunny' ? 'sonnigen' :
                       weather === 'cloudy' ? 'bewölkten' : 'wechselhaften';
    
    const activities = [];
    
    // Generate one activity suggestion for each interest
    for (const interest of interests) {
      const suggestions = await getActivitySuggestions(timeOfDay, interest, weather);
      if (suggestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        activities.push({
          category: interest,
          suggestion: suggestions[randomIndex].activity
        });
      }
    }
    
    // Create the perfect day response
    let response = `Für einen perfekten ${timeText} bei ${weatherText} Wetter empfehle ich dir:\n\n`;
    
    activities.forEach(activity => {
      response += `- ${activity.category}: ${activity.suggestion}\n`;
    });
    
    return response;
  } catch (error) {
    console.error('Error generating perfect day response:', error);
    return 'Ich konnte leider keinen perfekten Tag für dich zusammenstellen. Bitte versuche es später noch einmal.';
  }
};
