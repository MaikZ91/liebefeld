
import { supabase } from "@/integrations/supabase/client";

export const fetchSuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  // Fetch all matching suggestions without limit
  const { data: suggestions, error } = await supabase
    .from('activity_suggestions')
    .select('activity, link')
    .eq('time_of_day', timeOfDay)
    .eq('category', interest)
    .eq('weather', weather === 'sunny' ? 'sunny' : 'cloudy');

  if (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }

  return suggestions || [];
};

export const fetchAllSuggestionsByCategory = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  // Get all suggestions without any filtering by weather
  const { data: suggestions, error } = await supabase
    .from('activity_suggestions')
    .select('activity, link')
    .eq('time_of_day', timeOfDay)
    .eq('category', interest);

  if (error) {
    console.error('Error fetching all suggestions:', error);
    return [];
  }

  return suggestions || [];
};
