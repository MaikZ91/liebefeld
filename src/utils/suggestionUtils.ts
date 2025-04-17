
import { supabase } from "@/integrations/supabase/client";

export const fetchSuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<string[]> => {
  const { data: suggestions, error } = await supabase
    .from('activity_suggestions')
    .select('activity')
    .eq('time_of_day', timeOfDay)
    .eq('category', interest)
    .eq('weather', weather === 'sunny' ? 'sunny' : 'cloudy');

  if (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }

  return suggestions.map(s => s.activity);
};

export const fetchAllSuggestionsByCategory = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<string[]> => {
  const { data: suggestions, error } = await supabase
    .from('activity_suggestions')
    .select('activity')
    .eq('time_of_day', timeOfDay)
    .eq('category', interest)
    .eq('weather', weather === 'sunny' ? 'sunny' : 'cloudy');

  if (error) {
    console.error('Error fetching all suggestions:', error);
    return [];
  }

  return suggestions.map(s => s.activity);
};
