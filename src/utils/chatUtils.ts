import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export const getWelcomeMessage = () => {
  const today = format(new Date(), 'EEEE, d. MMMM', { locale: de });
  return `
    <div class="rounded-lg p-3 text-sm">
      <p>
        Hallo! Ich bin dein persönlicher Event-Assistent für Liebefeld. 
        Ich helfe dir, die besten Veranstaltungen in deiner Nähe zu finden.
      </p>
      <p class="mt-2">
        Aktuelles Datum: <strong>${today}</strong>
      </p>
    </div>
  `;
};

export const formatEvents = (events: any[]) => {
  if (!events || events.length === 0) {
    return '<p>Keine Events gefunden.</p>';
  }

  let eventList = '<ul class="list-disc pl-5">';
  events.forEach(event => {
    eventList += `<li>${event.title} - ${event.date}</li>`;
  });
  eventList += '</ul>';

  return eventList;
};

export const createResponseHeader = (title: string) => {
  return `<h4 class="font-medium text-sm text-red-600 dark:text-red-400">${title}</h4>`;
};

export const generateResponse = async (query: string, events: any[], isHeartMode = false) => {
  try {
    // Get current date and calculate next week's range
    const currentDate = new Date().toISOString().split('T')[0];
    const nextWeekStartDate = new Date();
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7 - nextWeekStartDate.getDay() + 1);
    const nextWeekStart = nextWeekStartDate.toISOString().split('T')[0];
    
    const nextWeekEndDate = new Date(nextWeekStartDate);
    nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 6);
    const nextWeekEnd = nextWeekEndDate.toISOString().split('T')[0];
    
    // Get user interests and preferred locations from localStorage
    let userInterests: string[] = [];
    let userLocations: string[] = [];
    
    try {
      const storedInterests = localStorage.getItem('user_interests');
      userInterests = storedInterests ? JSON.parse(storedInterests) : [];
      
      const storedLocations = localStorage.getItem('user_locations');
      userLocations = storedLocations ? JSON.parse(storedLocations) : [];
      
      // Ensure we have arrays even if localStorage returned invalid data
      if (!Array.isArray(userInterests)) userInterests = [];
      if (!Array.isArray(userLocations)) userLocations = [];
      
      console.log('[chatUtils] Heart mode active:', isHeartMode);
      console.log('[chatUtils] User interests from localStorage:', JSON.stringify(userInterests));
      console.log('[chatUtils] User locations from localStorage:', JSON.stringify(userLocations));
    } catch (err) {
      console.error('[chatUtils] Error getting data from localStorage:', err);
      userInterests = [];
      userLocations = [];
    }
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Fetch the weather once per session if needed
      const weather = sessionStorage.getItem('weather') || 'partly_cloudy';
      
      // Get time of day
      const hour = new Date().getHours();
      let timeOfDay = 'afternoon';
      if (hour < 12) timeOfDay = 'morning';
      else if (hour >= 18) timeOfDay = 'evening';
      
      // Always send user interests with personalized requests or in heart mode
      const interestsToSend = isHeartMode ? userInterests : 
                            (query.includes('zu mir passen') || 
                            query.includes('persönlich') || 
                            query.includes('❤️') ? userInterests : null);
      
      // Only send location filter if heart mode is active or personalized query
      const locationsToSend = isHeartMode || 
                            query.includes('zu mir passen') || 
                            query.includes('persönlich') || 
                            query.includes('❤️') ? userLocations : null;
      
      console.log('[chatUtils] Sending interests to edge function:', JSON.stringify(interestsToSend));
      console.log('[chatUtils] Sending locations to edge function:', JSON.stringify(locationsToSend));
      
      // Double-check what will be sent to the edge function
      const payload = {
        query,
        timeOfDay,
        weather,
        allEvents: events,
        currentDate,
        nextWeekStart,
        nextWeekEnd,
        userInterests: interestsToSend,
        userLocations: locationsToSend
      };
      console.log('[chatUtils] Full payload being sent to edge function:', JSON.stringify(payload));
      
      // Call the edge function using the supabase client instead of direct fetch
      const { data, error } = await supabase.functions.invoke('ai-event-chat', {
        body: payload
      });
      
      if (error) {
        console.error('[chatUtils] Edge function error details:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      return data.response;
    } else {
      // For SSR or testing environments
      return createResponseHeader('Keine Events gefunden') +
        `<p>Ich konnte keine Events finden, die zu deiner Anfrage passen.</p>`;
    }
  } catch (error) {
    console.error('[chatUtils] Error generating response:', error);
    return createResponseHeader('Fehler') +
      `<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
        Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
        Bitte versuche es später noch einmal.
      </div>`;
  }
};

export const generatePersonalizedPrompt = (interests?: string[], locations?: string[]) => {
  // Ensure we have arrays even if parameters are undefined
  const userInterests = interests?.length ? interests : [];
  const userLocations = locations?.length ? locations : [];
  
  console.log('[chatUtils] Generating personalized prompt with interests:', JSON.stringify(userInterests));
  console.log('[chatUtils] Generating personalized prompt with locations:', JSON.stringify(userLocations));
  
  // Base query for heart mode
  let prompt = "";
  
  // If we have specific interests, create a personalized prompt
  if (userInterests.length > 0) {
    // Add heart emoji to indicate heart mode
    prompt = `❤️ Zeige mir Events, die zu meinen Interessen passen: ${userInterests.join(', ')}`;
    
    // Add locations context if available
    if (userLocations.length > 0) {
      prompt += `. Bevorzugte Orte: ${userLocations.join(', ')}`;
    }
  } 
  // If we only have locations but no interests
  else if (userLocations.length > 0) {
    prompt = `❤️ Zeige mir Events an meinen bevorzugten Orten: ${userLocations.join(', ')}`;
  }
  // Fallback if we have neither
  else {
    prompt = "❤️ Finde Events, die zu mir passen";
  }
  
  prompt += ". Zeige mir eine personalisierte Auswahl von Events.";
  
  console.log('[chatUtils] Generated personalized prompt:', prompt);
  return prompt;
};

// Extract all unique locations from events
export const extractAllLocations = (events: any[]): string[] => {
  if (!events || !Array.isArray(events) || events.length === 0) {
    console.log('[chatUtils] No events to extract locations from');
    return [];
  }
  
  const locationSet = new Set<string>();
  
  events.forEach(event => {
    if (event.location && typeof event.location === 'string' && event.location.trim() !== '') {
      locationSet.add(event.location.trim());
    }
  });
  
  const locationArray = Array.from(locationSet);
  console.log(`[chatUtils] Extracted ${locationArray.length} unique locations from ${events.length} events`);
  return locationArray;
};
