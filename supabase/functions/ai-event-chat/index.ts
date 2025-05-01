
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
    const { 
      query, 
      timeOfDay, 
      weather, 
      allEvents, 
      currentDate, 
      nextWeekStart, 
      nextWeekEnd,
      formatInstructions 
    } = await req.json();
    
    // Log date info
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    console.log(`Server current date: ${today}`);
    console.log(`Received currentDate from client: ${currentDate}`);
    console.log(`Received next week range: ${nextWeekStart} to ${nextWeekEnd}`);
    
    // Fetch all events from the database for backup/fallback
    const { data: dbEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    const events = allEvents && allEvents.length > 0 ? allEvents : dbEvents;
    
    console.log(`Processing ${events.length} events for AI response (${allEvents ? allEvents.length : 0} provided from frontend)`);
    
    // Log statistics
    const todayEvents = events.filter(event => event.date === today);
    console.log(`Events specifically for today (${today}): ${todayEvents.length}`);
    if (todayEvents.length > 0) {
      console.log('First few today events:', todayEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Log next week events
    const nextWeekEvents = events.filter(event => 
      event.date >= nextWeekStart && event.date <= nextWeekEnd
    );
    console.log(`Events for next week (${nextWeekStart} to ${nextWeekEnd}): ${nextWeekEvents.length}`);
    if (nextWeekEvents.length > 0) {
      console.log('First few next week events:', nextWeekEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Format events data for the AI
    const formattedEvents = events.map(event => `
      Event: ${event.title}
      Datum: ${event.date}
      Zeit: ${event.time}
      Kategorie: ${event.category}
      ${event.location ? `Ort: ${event.location}` : ''}
      ${event.description ? `Beschreibung: ${event.description}` : ''}
      ${event.link ? `Link: ${event.link}` : ''}
      ${event.id.startsWith('github-') ? 'Quelle: Externe Veranstaltung' : 'Quelle: Community Event'}
    `).join('\n\n');

    // Add custom formatting instructions if provided
    const additionalInstructions = formatInstructions 
      ? `\n\nWichtig: ${formatInstructions}`
      : '';

    const systemMessage = `Du bist ein hilfreicher Event-Assistent für Liebefeld. 
    Aktueller Tag: ${today} (Format: YYYY-MM-DD)
    Aktuelle Tageszeit: ${timeOfDay}
    Aktuelles Wetter: ${weather}
    
    Hier sind die verfügbaren Events:
    ${formattedEvents}
    
    Beantworte Fragen zu den Events präzise und freundlich auf Deutsch. 
    Berücksichtige dabei:
    1. Wenn der Nutzer nach "heute" fragt, beziehe dich auf Events mit Datum ${today}
    2. Wenn der Nutzer nach "nächster Woche" fragt, beziehe dich auf Events vom ${nextWeekStart} (Montag) bis ${nextWeekEnd} (Sonntag)
    3. Die Woche beginnt immer am Montag und endet am Sonntag
    4. Die aktuelle Tageszeit und das Wetter
    5. Die spezifischen Interessen in der Anfrage
    6. Gib relevante Events mit allen Details an
    7. Wenn keine passenden Events gefunden wurden, mache alternative Vorschläge
    8. Berücksichtige ALLE Events, auch die aus externen Quellen (mit 'Quelle: Externe Veranstaltung' gekennzeichnet)
    9. Verwende das Datum-Format YYYY-MM-DD für Vergleiche
    10. Mache den Titel eines Events immer klickbar, wenn ein Link vorhanden ist
    11. Erwähne KEINE "Quelle: Externe Veranstaltung" oder "Quelle: Community Event" Angaben in deinen Antworten
    
    Formatiere deine Antworten kompakt im Stil der Event-Liste, indem du für jedes Event folgendes HTML-Format verwendest:
    
    <div class="dark-glass-card rounded-lg p-1.5 mb-0.5 w-full">
      <div class="flex justify-between items-start gap-1">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 flex-wrap">
            [FALLS LINK VORHANDEN] <h4 class="font-medium text-sm text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1">
              <a href="EVENT_LINK" target="_blank" rel="noopener noreferrer">EVENT_TITEL</a>
              <svg class="w-2 h-2 inline-flex flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 17L17 7M17 7H8M17 7V16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </h4>
            [SONST] <h4 class="font-medium text-sm text-white break-words line-clamp-1 text-left">EVENT_TITEL</h4>
          </div>
          
          <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>EVENT_ZEIT</span>
            </div>
            <div class="flex items-center max-w-[120px] overflow-hidden">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>
                <circle cx="12" cy="10" r="3" stroke-width="2"/>
              </svg>
              <span class="truncate">EVENT_ORT</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <div class="flex-shrink-0 flex items-center gap-0.5 text-xs font-medium whitespace-nowrap px-1 py-0 h-5 bg-black text-red-500 rounded">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/>
            </svg>
            EVENT_KATEGORIE
          </div>
          
          <div class="flex items-center gap-0.5">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
    
    Füge für Veranstaltungsbeschreibungen diesen Code nach dem Event-Card hinzu:
    <div class="pl-2 pb-2 text-xs text-gray-300">EVENT_BESCHREIBUNG</div>
    
    Stelle sicher, dass:
    1. Die Event-Karten kompakt und übersichtlich sind
    2. Alle Links im Text korrekt verlinkt sind
    3. Die Formatierung dem Event Panel Design im Chat entspricht
    4. Erwähne KEINE Quellenangaben in deinen Antworten
    ${additionalInstructions}
    `;

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
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
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
