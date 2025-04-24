
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchWeather } from './weatherUtils';
import { supabase } from '@/integrations/supabase/client';

export const getWelcomeMessage = () => {
  return `
    <div class="bg-green-900/10 border border-green-700/30 rounded-lg p-2 text-sm">
      Ich bin dein persönlicher Assistent für alle Liebefeld Events.
      <br /><br />
      Frag mich zum Beispiel:
      <ul>
        <li>"Welche Events gibt es heute?"</li>
        <li>"Was kann ich am Wochenende machen?"</li>
        <li>"Gibt es Konzerte im Lokschuppen?"</li>
      </ul>
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
    eventsHtml += `
      <div class="mb-4 p-3 rounded-md bg-gray-900/20 border border-gray-700/30">
        <h5 class="font-medium text-red-500">${event.title}</h5>
        <p class="text-sm">
          ${format(new Date(event.date), 'EEEE, d. MMMM yyyy', { locale: de })}
          um ${event.time} Uhr
          ${event.location ? `im ${event.location}` : ''}
        </p>
        ${event.description ? `<p class="text-sm mt-1">${event.description}</p>` : ''}
      </div>
    `;
  });

  return eventsHtml;
};

export const generateResponse = async (query: string, events: any[]) => {
  try {
    const response = await fetch('https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/ai-event-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Fix: Use the raw API key instead of the protected property
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo`
      },
      body: JSON.stringify({
        query,
        timeOfDay: getTimeOfDay(),
        weather: await fetchWeather()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return createResponseHeader("KI-Antwort") + data.response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return createResponseHeader("Fehler") + `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
        Entschuldigung, ich konnte keine passende Antwort generieren. 
        Bitte versuche es später noch einmal oder formuliere deine Frage anders.
      </div>`;
  }
};
