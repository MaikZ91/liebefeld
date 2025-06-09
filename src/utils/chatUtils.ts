
import { supabase } from '@/integrations/supabase/client';

export const createResponseHeader = (title: string) => {
  return `
    <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 mb-3">
      <h3 class="text-red-400 font-medium text-sm">${title}</h3>
    </div>
  `;
};

export const getWelcomeMessage = () => {
  return `
    <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
      <h3 class="text-red-400 font-medium mb-2">Hallo! 👋</h3>
      <p class="text-white text-sm mb-2">
        Ich bin dein persönlicher Event-Assistent für Liebefeld. Ich kann dir dabei helfen, die perfekten Events zu finden!
      </p>
      <div class="text-xs text-red-200">
        <p class="mb-1">Du kannst mich zum Beispiel fragen:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>"Welche Events gibt es heute?"</li>
          <li>"Was kann ich am Wochenende machen?"</li>
          <li>"Gibt es Konzerte in Bielefeld?"</li>
        </ul>
      </div>
    </div>
  `;
};

export const generatePersonalizedPrompt = (interests: string[], locations: string[]) => {
  const interestsText = interests.length > 0 ? interests.join(', ') : 'allgemeine Interessen';
  const locationsText = locations.length > 0 ? locations.join(', ') : 'alle Standorte';
  
  return `Zeige mir Events, die zu meinen Interessen passen: ${interestsText}. Bevorzugte Standorte: ${locationsText}. Was empfiehlst du mir für heute und die nächsten Tage?`;
};

export const extractAllLocations = (events: any[]): string[] => {
  const locations = new Set<string>();
  
  events.forEach(event => {
    if (event.location && typeof event.location === 'string' && event.location.trim()) {
      locations.add(event.location.trim());
    }
  });
  
  // Add some common locations as fallbacks
  const commonLocations = ['Liebefeld', 'Bern', 'Bielefeld', 'Lokschuppen', 'Museum Osthusschule'];
  commonLocations.forEach(location => locations.add(location));
  
  return Array.from(locations).sort();
};

export const generateResponse = async (query: string, events: any[], isHeartActive: boolean = false) => {
  try {
    console.log('[chatUtils] Starting AI response generation...');
    console.log('[chatUtils] Query:', query);
    console.log('[chatUtils] Events count:', events.length);
    console.log('[chatUtils] Heart mode active:', isHeartActive);

    // Get current date and calculate next week
    const currentDate = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStart = nextWeek.toISOString().split('T')[0];
    const endOfNextWeek = new Date(nextWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
    const nextWeekEnd = endOfNextWeek.toISOString().split('T')[0];

    // Get user interests and locations if heart mode is active
    let userInterests: string[] = [];
    let userLocations: string[] = [];
    
    if (isHeartActive) {
      try {
        // Try to get user profile from localStorage or other source
        const storedProfile = localStorage.getItem('user_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          userInterests = profile.interests || [];
          userLocations = profile.favorite_locations || [];
        }
        console.log('[chatUtils] User interests:', userInterests);
        console.log('[chatUtils] User locations:', userLocations);
      } catch (error) {
        console.error('[chatUtils] Error getting user profile:', error);
      }
    }

    const requestBody = {
      query,
      timeOfDay: new Date().getHours(),
      weather: 'sunny', // Could be dynamic
      allEvents: events,
      currentDate,
      nextWeekStart,
      nextWeekEnd,
      userInterests: isHeartActive ? userInterests : undefined,
      userLocations: isHeartActive ? userLocations : undefined
    };

    console.log('[chatUtils] Calling ai-event-chat function with:', requestBody);

    const { data, error } = await supabase.functions.invoke('ai-event-chat', {
      body: requestBody
    });

    if (error) {
      console.error('[chatUtils] Supabase function error:', error);
      throw new Error(`Fehler beim Abrufen der AI-Antwort: ${error.message}`);
    }

    console.log('[chatUtils] AI response received:', data);
    console.log('[chatUtils] AI response type:', typeof data);
    console.log('[chatUtils] AI response has panelData:', !!data?.panelData);
    console.log('[chatUtils] AI response has textResponse:', !!data?.textResponse);

    // Check if we got a structured response with panelData and textResponse
    if (data && typeof data === 'object') {
      if (data.panelData && data.textResponse) {
        console.log('[chatUtils] Returning structured response with panelData and textResponse');
        console.log('[chatUtils] PanelData events count:', data.panelData.events?.length || 0);
        return {
          panelData: data.panelData,
          textResponse: data.textResponse
        };
      } else if (data.response) {
        // Fallback for old format
        console.log('[chatUtils] Returning text response from old format');
        return data.response;
      }
    }

    // If we get here, something went wrong
    console.error('[chatUtils] Unexpected response format:', data);
    return 'Es tut mir leid, ich konnte keine passende Antwort generieren.';

  } catch (error) {
    console.error('[chatUtils] Error in generateResponse:', error);
    throw error;
  }
};
