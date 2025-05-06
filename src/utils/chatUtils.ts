
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const getWelcomeMessage = () => {
  const today = format(new Date(), 'EEEE, d. MMMM', { locale: require('date-fns/locale/de') });
  return `
    <div class="rounded-lg p-3 text-sm">
      <p>
        Hallo! Ich bin dein persönlicher Event-Assistent für Liebefeld. 
        Ich helfe dir, die besten Veranstaltungen in deiner Nähe zu finden.
      </p>
      <p class="mt-2">
        Aktuelles Datum: <strong>${today}</strong>
      </p>
      <p class="mt-2">
        Frag mich zum Beispiel:
      </p>
      <ul class="list-disc pl-5 mt-2">
        <li>"Welche Events gibt es heute?"</li>
        <li>"Was kann ich am Wochenende machen?"</li>
        <li>"Gibt es Konzerte im Lokschuppen?"</li>
      </ul>
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

export const generateResponse = async (query: string, events: any[]) => {
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
    const userInterests = localStorage.getItem('user_interests') 
      ? JSON.parse(localStorage.getItem('user_interests') || '[]') 
      : null;
      
    const userLocations = localStorage.getItem('user_locations') 
      ? JSON.parse(localStorage.getItem('user_locations') || '[]') 
      : null;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Fetch the weather once per session if needed
      const weather = sessionStorage.getItem('weather') || 'partly_cloudy';
      
      // Get time of day
      const hour = new Date().getHours();
      let timeOfDay = 'afternoon';
      if (hour < 12) timeOfDay = 'morning';
      else if (hour >= 18) timeOfDay = 'evening';
      
      // Check if this is a heart mode query
      const isHeartMode = query.toLowerCase().includes('herz');
      
      // Call the edge function using the supabase client instead of direct fetch
      const { data, error } = await supabase.functions.invoke('ai-event-chat', {
        body: {
          query,
          timeOfDay,
          weather,
          allEvents: events,
          currentDate,
          nextWeekStart,
          nextWeekEnd,
          userInterests,
          userLocations
        }
      });
      
      if (error) {
        console.error('Edge function error details:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      return data.response;
    } else {
      // For SSR or testing environments
      return createResponseHeader('Keine Events gefunden') +
        `<p>Ich konnte keine Events finden, die zu deiner Anfrage passen.</p>`;
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return createResponseHeader('Fehler') +
      `<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
        Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : String(error)}. 
        Bitte versuche es später noch einmal.
      </div>`;
  }
};

export const generatePersonalizedPrompt = (interests?: string[], locations?: string[]) => {
  // Base query for heart mode
  let prompt = "";
  
  // If we have specific locations, create a prompt to find events at those locations
  if (locations && locations.length > 0) {
    // Add heart emoji to indicate heart mode
    prompt = `❤️ Zeige mir Events an meinen bevorzugten Orten: ${locations.join(', ')}`;
    
    // Add interests context if available
    if (interests && interests.length > 0) {
      prompt += `. Ich interessiere mich besonders für: ${interests.join(', ')}`;
    }
  } else {
    // Fallback to general personalized prompt
    prompt = "Finde Events, die zu mir passen";
    
    if (interests && interests.length > 0) {
      prompt += `. Meine Interessen sind: ${interests.join(', ')}`;
    }
    
    if (locations && locations.length > 0) {
      prompt += `. Meine bevorzugten Orte sind: ${locations.join(', ')}`;
    }
    
    prompt += ". Zeige mir eine personalisierte Auswahl von Events.";
  }
  
  return prompt;
};
