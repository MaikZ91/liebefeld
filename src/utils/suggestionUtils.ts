
import { supabase } from "@/integrations/supabase/client";

export const fetchSuggestions = async (
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  interest: string,
  weather: string
): Promise<Array<{ activity: string; link?: string | null }>> => {
  // Fetch ALL suggestions for the given category, time of day, and weather
  const { data: suggestions, error } = await supabase
    .from('activity_suggestions')
    .select('activity, link')
    .eq('time_of_day', timeOfDay)
    .eq('category', interest)
    .eq('weather', weather);

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
  // Get ALL suggestions for the category, filtered by time of day
  const { data: suggestions, error } = await supabase
    .from('activity_suggestions')
    .select('activity, link')
    .eq('time_of_day', timeOfDay)
    .eq('category', interest)
    // Optionally filter by weather, but with a broader approach
    .or(`weather.eq.${weather},weather.eq.sunny,weather.eq.cloudy`);

  if (error) {
    console.error('Error fetching all suggestions:', error);
    return [];
  }

  return suggestions || [];
};
