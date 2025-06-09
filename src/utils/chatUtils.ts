
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

// Original formatting logic from the edge function
export const formatEventContent = (aiContent: string, isHeartActive: boolean = false, userInterests: string[] = []) => {
  let processedContent = aiContent;

  // Transform markdown lists to HTML with original event card formatting
  processedContent = processedContent.replace(/\n[\*\-]\s+(.*?)(?=\n[\*\-]|\n\n|$)/g, (match, item) => {
    const titleMatch = item.match(/(.*?) um (.*?) (?:in|bei|im) (.*?) \(Kategorie: (.*?)\)/i);
    if (titleMatch) {
      const [_, title, time, location, category] = titleMatch;
      return `
        <li class="dark-glass-card rounded-lg p-2 mb-2 hover-scale">
          <div class="flex justify-between items-start gap-1">
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-sm text-white break-words">${title}</h4>
              <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
                <div class="flex items-center">
                  <svg class="w-3 h-3 mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${time} Uhr</span>
                </div>
                <div class="flex items-center max-w-[120px] overflow-hidden">
                  <svg class="w-3 h-3 mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span class="truncate">${location}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="bg-black text-red-500 dark:bg-black dark:text-red-500 flex-shrink-0 flex items-center gap-0.5 text-xs font-medium whitespace-nowrap px-1.5 py-0.5 rounded-md">
                <svg class="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${category}
              </span>
            </div>
          </div>
        </li>`;
    }
    return `<li class="mb-1">${item}</li>`;
  });
  
  // Add <ul> tags around lists
  if (processedContent.includes('<li>')) {
    processedContent = processedContent.replace(/<li>/, '<ul class="space-y-2 my-3"><li>');
    processedContent = processedContent.replace(/([^>])$/, '$1</ul>');
    if (!processedContent.endsWith('</ul>')) {
      processedContent += '</ul>';
    }
  }
  
  // Transform markdown bold to HTML bold with red color
  processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-500">$1</strong>');
  processedContent = processedContent.replace(/__(.*?)__/g, '<strong class="text-red-500">$1</strong>');
  
  // Highlight personalized content if heart mode is active
  if (isHeartActive && userInterests && userInterests.length > 0) {
    userInterests.forEach((interest: string) => {
      const interestRegex = new RegExp(`\\b(${interest})\\b`, 'gi');
      processedContent = processedContent.replace(interestRegex, '<strong class="text-yellow-500">$1</strong>');
    });
    
    const interestsLabel = userInterests && userInterests.length > 0 
      ? `basierend auf deinem Interesse für ${userInterests.join(', ')}` 
      : 'basierend auf deinen Vorlieben';
      
    const personalizationBadge = `
      <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-2 mb-3">
        <p class="text-sm flex items-center gap-1">
          <svg class="w-4 h-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          <span>Personalisierte Vorschläge ${interestsLabel}</span>
        </p>
      </div>
    `;
    
    processedContent = personalizationBadge + processedContent;
  }

  return processedContent;
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
        
        // Apply original formatting to the text response
        const formattedTextResponse = formatEventContent(data.textResponse, isHeartActive, userInterests);
        
        return {
          panelData: data.panelData,
          textResponse: formattedTextResponse
        };
      } else if (data.response) {
        // Fallback for old format
        console.log('[chatUtils] Returning text response from old format');
        const formattedResponse = formatEventContent(data.response, isHeartActive, userInterests);
        return formattedResponse;
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
