
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
      formatInstructions 
    } = await req.json();
    
    // Get current server date
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`Server current date: ${formattedToday}`);
    console.log(`Received currentDate from client: ${currentDate}`);
    
    // Calculate tomorrow and day after tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    const formattedDayAfterTomorrow = dayAfterTomorrow.toISOString().split('T')[0];
    
    console.log(`Today: ${formattedToday}, Tomorrow: ${formattedTomorrow}, Day after tomorrow: ${formattedDayAfterTomorrow}`);
    
    // Calculate next week's date range (Monday to Sunday)
    const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysToAdd = currentDay === 0 ? 1 : (8 - currentDay); // If today is Sunday, add 1 to get to Monday, otherwise calculate
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + daysToAdd);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    
    const nextWeekStartStr = nextWeekStart.toISOString().split('T')[0];
    const nextWeekEndStr = nextWeekEnd.toISOString().split('T')[0];
    
    console.log(`Next week range: ${nextWeekStartStr} (Monday) to ${nextWeekEndStr} (Sunday)`);

    // Fetch all events from the database as fallback
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
    const todayEvents = events.filter(event => event.date === formattedToday);
    console.log(`Events specifically for today (${formattedToday}): ${todayEvents.length}`);
    if (todayEvents.length > 0) {
      console.log('First few today events:', todayEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Log tomorrow events
    const tomorrowEvents = events.filter(event => event.date === formattedTomorrow);
    console.log(`Events specifically for tomorrow (${formattedTomorrow}): ${tomorrowEvents.length}`);
    if (tomorrowEvents.length > 0) {
      console.log('First few tomorrow events:', tomorrowEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Log day after tomorrow events
    const dayAfterTomorrowEvents = events.filter(event => event.date === formattedDayAfterTomorrow);
    console.log(`Events specifically for day after tomorrow (${formattedDayAfterTomorrow}): ${dayAfterTomorrowEvents.length}`);
    if (dayAfterTomorrowEvents.length > 0) {
      console.log('First few day after tomorrow events:', dayAfterTomorrowEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Log next week events
    const nextWeekEvents = events.filter(event => 
      event.date >= nextWeekStartStr && event.date <= nextWeekEndStr
    );
    console.log(`Events for next week (${nextWeekStartStr} to ${nextWeekEndStr}): ${nextWeekEvents.length}`);
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
    Aktueller Tag: ${formattedToday} (Format: YYYY-MM-DD)
    Aktuelle Tageszeit: ${timeOfDay}
    Aktuelles Wetter: ${weather}
    
    Hier sind die verfügbaren Events:
    ${formattedEvents}
    
    Beantworte Fragen zu den Events präzise und freundlich auf Deutsch. 
    Berücksichtige dabei:
    1. Wenn der Nutzer nach "heute" fragt, beziehe dich auf Events mit Datum ${formattedToday}
    2. Wenn der Nutzer nach "morgen" fragt, beziehe dich auf Events mit Datum ${formattedTomorrow} 
    3. Wenn der Nutzer nach "übermorgen" fragt, beziehe dich auf Events mit Datum ${formattedDayAfterTomorrow}
    4. Wenn der Nutzer nach "nächster Woche" fragt, beziehe dich auf Events vom ${nextWeekStartStr} (Montag) bis ${nextWeekEndStr} (Sonntag)
    5. Die Woche beginnt immer am Montag und endet am Sonntag
    6. Die aktuelle Tageszeit und das Wetter
    7. Die spezifischen Interessen in der Anfrage
    8. WICHTIG: Zeige IMMER MEHRERE Events an (mindestens 5-10, wenn verfügbar)
    9. Wenn keine passenden Events gefunden wurden, mache alternative Vorschläge
    10. Das Datum-Format YYYY-MM-DD für Vergleiche
    11. WICHTIG: Zeige IMMER MEHRERE Events an, nicht nur eines
    
    KORREKTES HTML-FORMAT FÜR EVENT-KARTEN:
    Verwende dieses exakte HTML-Format für Events und stelle viele Events dar, gruppiert nach Datum:
    
    <div class="text-xs text-red-500 font-medium mt-2 mb-1">DATUM</div>
    
    <div class="dark-glass-card rounded-lg p-1.5 mb-0.5 w-full">
      <div class="flex justify-between items-start gap-1">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 flex-wrap">
            <h4 class="font-medium text-sm text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1">
              <!-- Wenn ein Link vorhanden ist, verwende diese Form: -->
              <a href="EVENT_LINK" target="_blank" rel="noopener noreferrer">EVENT_TITEL</a>
              <svg class="w-2 h-2 inline-flex flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 17L17 7M17 7H8M17 7V16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- Wenn kein Link vorhanden ist, nur den Titel anzeigen: -->
              <!-- EVENT_TITEL -->
            </h4>
          </div>
          
          <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>EVENT_ZEIT Uhr</span>
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
    
    WICHTIGE REGELN:
    1. IMMER MEHRERE Events anzeigen (5-10 minimum wenn verfügbar)
    2. Das HTML-Format genau wie oben angegeben verwenden
    3. Bei Links den Eventtitel in den <a> Tag einbetten, nicht den Link selbst anzeigen
    4. Wenn der Benutzer nach "übermorgen" fragt, nutze explizit das Datum ${formattedDayAfterTomorrow}
    5. Wenn der Benutzer nach "morgen" fragt, nutze explizit das Datum ${formattedTomorrow}
    6. Zeige ALLE relevanten Events, nicht nur eine Auswahl
    7. Schreibe deinen Text als normale Antwort, aber stelle die Events im angegebenen HTML-Format dar
    8. Achte besonders auf das korrekte Datumsformat bei Datumsbegriffen wie "morgen", "übermorgen", "nächste Woche"
    9. STELLE SICHER, dass bei Events mit Links der TITLE im a-Tag angezeigt wird, NICHT der Link selbst
    10. STELLE SICHER, dass du das Heart-Icon bei jedem Event anzeigst 
    ${additionalInstructions}
    
    BEISPIEL FÜR EINE KORREKTE ANTWORT MIT MEHREREN EVENTS:
    
    Hier sind einige Events für morgen (${formattedTomorrow}):
    
    <div class="text-xs text-red-500 font-medium mt-2 mb-1">${formattedTomorrow}</div>
    
    <div class="dark-glass-card rounded-lg p-1.5 mb-0.5 w-full">
      <div class="flex justify-between items-start gap-1">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 flex-wrap">
            <h4 class="font-medium text-sm text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1">
              <a href="https://example.com/event1" target="_blank" rel="noopener noreferrer">Konzert im Park</a>
              <svg class="w-2 h-2 inline-flex flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 17L17 7M17 7H8M17 7V16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </h4>
          </div>
          
          <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>19:30 Uhr</span>
            </div>
            <div class="flex items-center max-w-[120px] overflow-hidden">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>
                <circle cx="12" cy="10" r="3" stroke-width="2"/>
              </svg>
              <span class="truncate">Stadtpark</span>
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
            Musik
          </div>
          
          <div class="flex items-center gap-0.5">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
    
    <div class="dark-glass-card rounded-lg p-1.5 mb-0.5 w-full">
      <div class="flex justify-between items-start gap-1">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 flex-wrap">
            <h4 class="font-medium text-sm text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1">
              Theater Aufführung
            </h4>
          </div>
          
          <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>20:00 Uhr</span>
            </div>
            <div class="flex items-center max-w-[120px] overflow-hidden">
              <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>
                <circle cx="12" cy="10" r="3" stroke-width="2"/>
              </svg>
              <span class="truncate">Stadttheater</span>
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
            Kultur
          </div>
          
          <div class="flex items-center gap-0.5">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
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
        temperature: 0.3, // Lower temperature for more consistent formatting
        max_tokens: 1500  // Increased max tokens to allow for more events
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI response generated successfully.');

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
