
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { query, timeOfDay, weather, allEvents } = await req.json();
    
    // Fetch all events from the database for backup/fallback
    const { data: dbEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    // Use the provided allEvents array (which includes GitHub events) instead of just database events
    const events = allEvents && allEvents.length > 0 ? allEvents : dbEvents;
    
    console.log(`Processing ${events.length} events for AI response (${allEvents ? allEvents.length : 0} provided from frontend)`);

    // Prüfe Events für heute
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.date === today);
    console.log(`Events für heute (${today}): ${todayEvents.length}`);
    
    // Bei Fragen nach heutigen Events, schnellere Antwort direkt zurückgeben
    const heutePatterns = [
      /heute/i, /today/i, /was geht/i, /was gibt/i, /was ist los/i, 
      /was läuft/i, /heute abend/i, /aktuell/i, /jetzt/i
    ];
    
    const isAskingForToday = heutePatterns.some(pattern => pattern.test(query));
    
    if (isAskingForToday && todayEvents.length > 0) {
      console.log('Direkte Antwort für heutige Events generieren');
      
      // Schnell direkte Antwort generieren ohne KI-Modell
      let response = `
        <div class="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3 mb-3">
          <p class="text-sm">Hier sind die Events für heute, ${today}:</p>
        </div>
      `;
      
      for (const event of todayEvents) {
        const isGitHubEvent = event.id.startsWith('github-');
        response += `
          <div class="mb-3 p-3 rounded-md ${isGitHubEvent ? 'bg-blue-900/10 border border-blue-700/30' : 'bg-gray-900/10 border border-gray-700/30'}">
            <h5 class="font-medium text-red-500">${event.title}</h5>
            <p class="text-xs text-gray-400">${isGitHubEvent ? 'Externe Veranstaltung' : 'Community Event'}</p>
            <p class="text-sm">
              um ${event.time} Uhr
              ${event.location ? `im ${event.location}` : ''}
            </p>
            ${event.description ? `<p class="text-sm mt-1">${event.description}</p>` : ''}
          </div>
        `;
      }
      
      return new Response(JSON.stringify({ response }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Format events data for the AI - making sure all events are included
    const formattedEvents = events.map(event => `
      Event: ${event.title}
      Datum: ${event.date}
      Zeit: ${event.time}
      Kategorie: ${event.category}
      ${event.location ? `Ort: ${event.location}` : ''}
      ${event.description ? `Beschreibung: ${event.description}` : ''}
      ${event.id.startsWith('github-') ? 'Quelle: Externe Veranstaltung' : 'Quelle: Community Event'}
    `).join('\n\n');

    const systemMessage = `Du bist ein hilfreicher Event-Assistent für Liebefeld. 
    Aktuelle Tageszeit: ${timeOfDay}
    Aktuelles Wetter: ${weather}
    
    Hier sind die verfügbaren Events:
    ${formattedEvents}
    
    Beantworte Fragen zu den Events präzise und freundlich auf Deutsch. 
    Berücksichtige dabei:
    1. Die aktuelle Tageszeit und das Wetter
    2. Die spezifischen Interessen in der Anfrage
    3. Gib relevante Events mit allen Details an
    4. Wenn keine passenden Events gefunden wurden, mache alternative Vorschläge
    5. Berücksichtige ALLE Events, auch die aus externen Quellen (mit 'Quelle: Externe Veranstaltung' gekennzeichnet)
    
    Format deine Antworten klar und übersichtlich.`;

    console.log('Sending request to Open Router API with Gemini model...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/lovable-chat', 
        'X-Title': 'Lovable Chat'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      console.error(`Open Router API error: ${response.status} ${response.statusText}`);
      
      // Fallback für heutige Events
      if (todayEvents.length > 0) {
        let fallbackResponse = '<div class="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-3 mb-3">';
        fallbackResponse += `<p class="text-sm">Hier sind die Events für heute (${today}):</p></div>`;
        
        for (const event of todayEvents) {
          const isGitHubEvent = event.id.startsWith('github-');
          fallbackResponse += `
            <div class="mb-3 p-3 rounded-md ${isGitHubEvent ? 'bg-blue-900/10 border border-blue-700/30' : 'bg-gray-900/10 border border-gray-700/30'}">
              <h5 class="font-medium text-red-500">${event.title}</h5>
              <p class="text-xs text-gray-400">${isGitHubEvent ? 'Externe Veranstaltung' : 'Community Event'}</p>
              <p class="text-sm">
                um ${event.time} Uhr
                ${event.location ? `im ${event.location}` : ''}
              </p>
              ${event.description ? `<p class="text-sm mt-1">${event.description}</p>` : ''}
            </div>
          `;
        }
        
        return new Response(JSON.stringify({ response: fallbackResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const fallbackResponse = `
        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
          <h5 class="font-medium text-sm text-yellow-600 dark:text-yellow-400">Lokale Antwort:</h5>
          <p class="text-sm mt-2">
            Ich konnte leider keine KI-Antwort für deine Frage generieren. 
            ${events.length > 0 ? 
              `Hier sind die nächsten ${Math.min(3, events.length)} Events, die stattfinden:` : 
              'Es sind derzeit keine Events verfügbar.'
            }
          </p>
          ${events.length > 0 ? 
            `<ul class="mt-2 space-y-2">
              ${events.slice(0, 3).map(event => `
                <li class="bg-gray-900/20 border border-gray-700/20 rounded-lg p-2">
                  <strong>${event.title}</strong> (${event.date}, ${event.time})
                  ${event.location ? `<br>Ort: ${event.location}` : ''}
                </li>
              `).join('')}
            </ul>` : ''
          }
          <p class="text-sm mt-2">
            Du kannst spezifischer nach Events fragen, z.B. nach Datum, Kategorie oder Ort.
          </p>
        </div>
      `;
      
      return new Response(JSON.stringify({ response: fallbackResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI chat function:', error);
    
    const errorResponse = `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
        <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der Verarbeitung:</h5>
        <p class="text-sm mt-2">
          Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. 
          Hier sind einige Möglichkeiten, wie du weitermachen kannst:
        </p>
        <ul class="list-disc list-inside mt-1 text-sm space-y-1">
          <li>Stelle deine Frage anders</li>
          <li>Frage nach Events für heute oder diese Woche</li>
          <li>Suche nach einer bestimmten Kategorie, wie "Konzerte" oder "Sport"</li>
        </ul>
      </div>
    `;
    
    return new Response(JSON.stringify({ response: errorResponse }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
