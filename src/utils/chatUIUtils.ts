
/**
 * Generiert Initialen aus einem Benutzernamen
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  // Bei mehrteiligen Namen die ersten Buchstaben jedes Worts nehmen
  const parts = name.split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) return '?';
  
  if (parts.length === 1) {
    // Bei einzeiligen Namen die ersten beiden Buchstaben oder nur den ersten
    const namePart = parts[0];
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return namePart.substring(0, 1).toUpperCase();
  }
  
  // Bei mehrteiligen Namen die Initialen der ersten beiden Teile
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

/**
 * Generiert einen zufälligen Avatar für neue Benutzer
 */
export const getRandomAvatar = (): string => {
  const avatars = [
    '/lovable-uploads/764c9b33-5d7d-4134-b503-c77e23c469f9.png',
    '/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png',
    '/lovable-uploads/c38064ee-a32f-4ecc-b148-f9c53c28d472.png',
    '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png'
  ];
  
  // Zufälligen Avatar auswählen
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
};

/**
 * Funktion, um Aktivitätsvorschläge aus dem Suggestion-Utils zu holen
 */
import { fetchSuggestions } from './suggestionUtils';

export const getActivitySuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  const suggestions = await fetchSuggestions(timeOfDay, interest, weather);
  // Limitiere die Anzahl der zurückgegebenen Vorschläge auf 4
  return suggestions.slice(0, 4);
};

/**
 * Funktion, um alle Vorschläge nach Kategorie zu holen
 */
import { fetchAllSuggestionsByCategory } from './suggestionUtils';

export const getAllSuggestionsByCategory = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string, 
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  return await fetchAllSuggestionsByCategory(timeOfDay, interest, weather);
};

/**
 * Generiert eine Antwort für einen perfekten Tag
 */
export const generatePerfectDayResponse = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  weather: string,
  interests: string[]
): Promise<string> => {
  // Einfache Vorschläge basierend auf Tageszeit und Wetter
  const timeBasedActivities = {
    morning: ['Ein Spaziergang im Park', 'Frühstück in einem Café', 'Yoga-Session'],
    afternoon: ['Shopping in der Stadt', 'Museumsbesuch', 'Fahrradtour'],
    evening: ['Konzertbesuch', 'Gemütliches Abendessen', 'Kinobesuch']
  };
  
  const weatherBasedActivities = {
    sunny: ['Picknick im Park', 'Biergarten besuchen', 'Open-Air-Event'],
    cloudy: ['Gemütliches Café', 'Shopping-Tour', 'Indoor-Aktivitäten'],
    partly_cloudy: ['Spaziergang am See', 'Stadtbummel', 'Ausstellung besuchen']
  };
  
  // Aktivitäten basierend auf Tageszeit und Wetter auswählen
  const timeActivities = timeBasedActivities[timeOfDay] || [];
  const weatherActivities = weatherBasedActivities[weather as keyof typeof weatherBasedActivities] || [];
  
  // Aktivitäten kombinieren und formatieren
  const activities = [...timeActivities, ...weatherActivities];
  const selectedActivities = activities.slice(0, 3);
  
  // Antwort generieren
  return `Für einen perfekten Tag in Liebefeld empfehle ich dir: ${selectedActivities.join(', ')}. Genieße deinen Tag!`;
};
