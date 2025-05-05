
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchWeather } from './weatherUtils';
import { supabase } from '@/integrations/supabase/client';

export const getWelcomeMessage = () => {
  return `
    <div class="bg-green-900/10 border border-green-700/30 rounded-lg p-2 text-sm">
      Ich bin dein persönlicher Assistent für alle Liebefeld Events.
    </div>
  `;
};

export const createResponseHeader = (title: string) => {
  return `
    <h4 class="font-medium text-md mb-2">${title}</h4>
  `;
};

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const formatEvents = (events: any[]) => {
  if (!events || events.length === 0) {
    return '<div class="bg-gray-900/20 border border-gray-700/30 rounded-lg p-2 text-sm">Keine Events gefunden.</div>';
  }

  let eventsHtml = '';
  events.forEach(event => {
    const isGitHubEvent = event.id.startsWith('github-');
    eventsHtml += `
      <div class="mb-2 p-2 rounded-md ${isGitHubEvent ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-gray-900/20 border border-gray-700/30'} hover:bg-opacity-30 transition-all">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            ${event.link ? 
              `<a href="${event.link}" target="_blank" rel="noopener noreferrer" class="font-medium text-red-500 hover:underline flex items-center gap-1">
                ${event.title}
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7M17 7H8M17 7V16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>` : 
              `<h5 class="font-medium text-red-500">${event.title}</h5>`
            }
            <p class="text-[10px] text-gray-400">${isGitHubEvent ? 'Externe Veranstaltung' : 'Community Event'}</p>
          </div>
          <div class="text-xs bg-black text-red-500 px-2 py-0.5 rounded-full">${event.category}</div>
        </div>
        <div class="mt-1 text-xs text-white">
          <div class="flex items-center gap-2">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/>
              </svg>
              ${format(new Date(event.date), 'EEEE, d. MMMM yyyy', { locale: de })}
            </div>
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
              ${event.time} Uhr
            </div>
          </div>
          <div class="flex items-center mt-0.5">
            <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>
              <circle cx="12" cy="10" r="3" stroke-width="2"/>
            </svg>
            ${event.location}
          </div>
        </div>
        ${event.description ? `<p class="text-xs mt-1 text-gray-300">${event.description}</p>` : ''}
      </div>
    `;
  });

  return eventsHtml;
};

interface ModelInfo {
  model: string;
  promptTokens: string | number;
  completionTokens: string | number;
  totalTokens: string | number;
  error?: string;
}

export const generateResponse = async (query: string, events: any[]) => {
  try {
    console.log(`Generating AI response for query: "${query}" with ${events.length} events`);
    
    // Aktuelle Datum für Debugging und Kontext für AI
    const currentDate = new Date();
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    console.log(`Current date being sent to AI: ${formattedDate}`);
    
    // Berechne Daten für nächste Woche
    const nextWeekStart = new Date(currentDate);
    // Setze auf nächsten Montag
    const dayOfWeek = currentDate.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
    const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // Wenn heute Sonntag ist, +1 für Montag, sonst (8 - aktueller Tag)
    nextWeekStart.setDate(currentDate.getDate() + daysToAdd);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Montag bis Sonntag = 7 Tage
    
    const nextWeekStartStr = format(nextWeekStart, 'yyyy-MM-dd');
    const nextWeekEndStr = format(nextWeekEnd, 'yyyy-MM-dd');
    console.log(`Next week range: ${nextWeekStartStr} (Montag) bis ${nextWeekEndStr} (Sonntag)`);
    
    // Log a sample of events being sent to check if GitHub events are included
    const sampleEvents = events.slice(0, 2);
    const githubEventsCount = events.filter(e => e.id.startsWith('github-')).length;
    console.log(`Sample of events being sent to AI: ${JSON.stringify(sampleEvents)}`);
    console.log(`Total events: ${events.length}, GitHub events: ${githubEventsCount}`);
    
    // Heute-Events für Debugging
    const todayEvents = events.filter(e => e.date === formattedDate);
    console.log(`Events specifically for today (${formattedDate}): ${todayEvents.length}`);
    if (todayEvents.length > 0) {
      console.log('First few today events:', todayEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Events für nächste Woche für Debugging
    const nextWeekEvents = events.filter(e => {
      const eventDate = e.date;
      return eventDate >= nextWeekStartStr && eventDate <= nextWeekEndStr;
    });
    console.log(`Events for next week (${nextWeekStartStr} to ${nextWeekEndStr}): ${nextWeekEvents.length}`);
    if (nextWeekEvents.length > 0) {
      console.log('First few next week events:', nextWeekEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Timeout für die Anfrage setzen
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 Sekunden Timeout
    
    const weatherInfo = await fetchWeather();
    const response = await fetch('https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/ai-event-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo`
      },
      body: JSON.stringify({
        query,
        timeOfDay: getTimeOfDay(),
        currentDate: formattedDate,
        nextWeekStart: nextWeekStartStr,
        nextWeekEnd: nextWeekEndStr,
        weather: weatherInfo,
        allEvents: events
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Error response from AI endpoint:', response.status, response.statusText);
      try {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to get AI response: ${response.status} ${response.statusText} - ${errorText}`);
      } catch (textError) {
        throw new Error(`Failed to get AI response: ${response.status} ${response.statusText}`);
      }
    }

    let data;
    try {
      data = await response.json();
      console.log('AI response data received:', Object.keys(data));
    } catch (jsonError) {
      console.error('Failed to parse response as JSON:', jsonError);
      const textResponse = await response.text();
      console.error('Raw response:', textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : ''));
      throw new Error('Invalid JSON response from AI endpoint');
    }
    
    // Extrahiere Model-Information falls vorhanden
    let modelInfoHtml = '';
    if (data.modelInfo) {
      const modelInfo: ModelInfo = data.modelInfo;
      
      if (modelInfo.error) {
        console.warn('Model reported error:', modelInfo.error);
      }
      
      // Get the model name without provider prefix (e.g., "google/gemini-2.0-flash-lite-001" -> "gemini-2.0-flash-lite-001")
      const modelName = (modelInfo.model && typeof modelInfo.model === 'string') 
        ? modelInfo.model.split('/')[1] || modelInfo.model
        : 'AI Model';
      
      // Simplify model name for display - shortcuts for common models
      let displayModelName = modelName;
      if (modelName.includes('gemini-2.0')) {
        displayModelName = 'Gemini 2.0';
      } else if (modelName.includes('claude-3')) {
        displayModelName = 'Claude 3';
      } else if (modelName.includes('gpt-4o')) {
        displayModelName = 'GPT-4o';
      }
      
      modelInfoHtml = `
        <div class="mt-2 text-xs text-gray-500">
          <p>Powered by ${displayModelName}</p>
        </div>`;
    }
    
    if (!data.response && data.error) {
      console.error('Error returned in successful response:', data.error);
      return createResponseHeader("Fehler") + `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm mb-3">
          Entschuldigung, es gab einen Fehler: ${data.error}
        </div>
      ` + modelInfoHtml;
    } else if (!data.response) {
      console.error('Missing response in AI data:', data);
      return createResponseHeader("Fehler") + `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm mb-3">
          Entschuldigung, die KI hat keine lesbare Antwort zurückgegeben. Bitte versuche es erneut.
        </div>
      ` + modelInfoHtml;
    }
    
    return createResponseHeader("KI-Antwort") + data.response + modelInfoHtml;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Bei Timeout oder anderen Fehlern, einfache Event-Liste als Fallback anzeigen
    return createResponseHeader("Fehler") + `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm mb-3">
        Entschuldigung, ich konnte keine KI-Antwort generieren: ${error.message}
        <br/>Hier sind die verfügbaren Events:
      </div>
      ${formatEvents(events)}`;
  }
};
