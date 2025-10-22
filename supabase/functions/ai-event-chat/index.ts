
// Using direct HTTP calls to avoid runtime dependency issues
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[ai-event-chat] START execution');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { 
      query, 
      timeOfDay, 
      weather, 
      currentDate, 
      nextWeekStart, 
      nextWeekEnd, 
      userInterests, 
      userLocations, 
      selectedCity 
    } = await req.json()

    console.log(`[ai-event-chat] START execution for query: "${query}"`);
    console.log(`[ai-event-chat] Received selectedCity: ${selectedCity}`);
    console.log(`[ai-event-chat] Received currentDate: ${currentDate}`);
    console.log(`[ai-event-chat] Received next week range: ${nextWeekStart} to ${nextWeekEnd}`);
    
    if (userInterests) {
      console.log(`[ai-event-chat] User interests received: ${JSON.stringify(userInterests)}`);
    } else {
      console.log('[ai-event-chat] No user interests received');
    }
    
    if (userLocations) {
      console.log(`[ai-event-chat] User locations received: ${JSON.stringify(userLocations)}`);
    } else {
      console.log('[ai-event-chat] No user locations received');
    }

    // Fetch all events from database
    console.log('[ai-event-chat] Fetching all events from database...');
    
    let eventsQuery = supabaseClient
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });

    // Apply city filter at database level
    if (selectedCity && selectedCity.toLowerCase() === 'bielefeld') {
      console.log(`[ai-event-chat] Applying DB filter for 'Bielefeld' (includes null city and 'bi').`);
      eventsQuery = eventsQuery.or('city.is.null,city.ilike.bielefeld,city.ilike.bi');
    } else if (selectedCity) {
      console.log(`[ai-event-chat] Applying DB filter for city: ${selectedCity}`);
      eventsQuery = eventsQuery.ilike('city', selectedCity);
    }

    const { data: allEvents, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('[ai-event-chat] Error fetching events:', eventsError);
      throw new Error(`Database error: ${eventsError.message}`);
    }

    console.log(`[ai-event-chat] Fetched ${allEvents?.length || 0} events from DB after initial city filter.`);

    if (!allEvents || allEvents.length === 0) {
      return new Response(JSON.stringify({
        response: `<div class="space-y-3">
          <h4 class="font-medium text-sm text-red-600">Keine Events gefunden</h4>
          <p>Aktuell sind keine Events für ${selectedCity || 'deine Stadt'} in der Datenbank verfügbar.</p>
        </div>`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ai-event-chat] Initial event pool for filtering has ${allEvents.length} events.`);

    // Check if this is a personalized request
    const isPersonalizedRequest = userInterests && userInterests.length > 0;
    console.log(`[ai-event-chat] Is this a personalized request? ${isPersonalizedRequest}`);

    // Current date analysis
    const currentMonth = currentDate.substring(0, 7); // YYYY-MM format
    const currentMonthStart = `${currentMonth}-01`;
    const currentMonthEnd = `${currentMonth}-31`;
    console.log(`[ai-event-chat] Current month range: ${currentMonthStart} to ${currentMonthEnd}`);

    let filteredEvents = allEvents;

    // Filter events based on query context
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('heute') || lowerQuery.includes('today')) {
      console.log(`[ai-event-chat] Anfrage nach Events für heute (${currentDate}) erkannt`);
      filteredEvents = allEvents.filter(event => event.date === currentDate);
      console.log(`[ai-event-chat] Nach Filterung für "heute": ${filteredEvents.length} Events übrig`);
    } else if (lowerQuery.includes('morgen') || lowerQuery.includes('tomorrow')) {
      // Fix: Parse date string explicitly and add 1 day
      const [year, month, day] = currentDate.split('-').map(Number);
      const tomorrow = new Date(year, month - 1, day + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      console.log(`[ai-event-chat] Anfrage nach Events für morgen (${tomorrowStr}) erkannt`);
      filteredEvents = allEvents.filter(event => event.date === tomorrowStr);
      console.log(`[ai-event-chat] Nach Filterung für "morgen": ${filteredEvents.length} Events übrig`);
    } else if (lowerQuery.includes('wochenende') || lowerQuery.includes('weekend')) {
      // Get next weekend dates
      const today = new Date(currentDate);
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      
      const nextSaturday = new Date(today);
      nextSaturday.setDate(today.getDate() + daysUntilSaturday);
      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);
      
      const saturdayStr = nextSaturday.toISOString().split('T')[0];
      const sundayStr = nextSunday.toISOString().split('T')[0];
      
      filteredEvents = allEvents.filter(event => 
        event.date === saturdayStr || event.date === sundayStr
      );
    } else {
      // For general queries, show future events from today onwards
      filteredEvents = allEvents.filter(event => event.date >= currentDate);
      console.log(`[ai-event-chat] Nach Filterung für zukünftige Events: ${filteredEvents.length} Events übrig`);
    }

    // If no events found after filtering, use fallback to next 20 upcoming events
    if (filteredEvents.length === 0) {
      console.log('Keine Events nach Filterung übrig, verwende die nächsten 20 anstehenden Events aus der Stadt-spezifischen Liste');
      filteredEvents = allEvents
        .filter(event => event.date >= currentDate)
        .slice(0, 20);
      console.log(`[ai-event-chat] Nach Fallback: ${filteredEvents.length} Events übrig`);
    }

    // Apply personalization if user interests are provided
    if (isPersonalizedRequest) {
      const personalizedEvents = filteredEvents.filter(event => {
        const eventText = `${event.title} ${event.description || ''} ${event.category || ''}`.toLowerCase();
        return userInterests.some(interest => eventText.includes(interest.toLowerCase()));
      });
      
      if (personalizedEvents.length > 0) {
        filteredEvents = personalizedEvents;
        console.log(`[ai-event-chat] Applied personalization filter: ${filteredEvents.length} matching events found`);
      } else {
        console.log('[ai-event-chat] No personalized events found, keeping all filtered events');
      }
    }

    console.log(`[ai-event-chat] Sende ${filteredEvents.length} gefilterte Events an das KI-Modell`);

    // Count events for current month for context
    const currentMonthEvents = allEvents.filter(event => 
      event.date >= currentMonthStart && event.date <= currentMonthEnd
    );
    console.log(`[ai-event-chat] Events für diesen Monat (${currentMonthStart} bis ${currentMonthEnd}): ${currentMonthEvents.length}`);

    // Get unique categories from filtered events
    const categories = [...new Set(filteredEvents.map(event => event.category).filter(Boolean))];
    console.log(`[ai-event-chat] Categories being sent: ${JSON.stringify(categories)}`);

    // Create system prompt
    const systemPrompt = `Du bist ein Event-Assistent für ${selectedCity || 'Bielefeld'}. Begrüße den Nutzer freundlich je nach Tageszeit. Liste dann alle Events als chronologische Timeline (geordnet nach Uhrzeit) auf. Gruppiere immer nach den 3 Kategorien: Ausgehen, Sport und Kreativität. Die Kategorie wird in GROßBUCHSTABEN in Rot aufgelistet. WICHTIG: Events mit der category "Sonstiges" werden immer der Kategorie "Ausgehen" zugewiesen! WICHTIG, WICHTIG: Wenn Improtheater im Eventname: wird immer der Kategorie "Kreativität" zugewiesen(ignoriere hier die category: Sport). Beschreibe jedes Event kurz, nimm dafür alle Infos die du hast die du hast für jedes Event. Aktuelles Datum: ${currentDate}.
Es gibt insgesamt ${allEvents.length} Events in der Datenbank für die ausgewählte Stadt. Ich habe dir die ${filteredEvents.length} relevantesten basierend auf deiner Anfrage ausgewählt.
Die Anzahl der Likes gibt an, wie beliebt ein Event ist.
Events mit vielen Likes sind besonders beliebt und bekommen oft den Vorzug bei Empfehlungen. Die Likes-Anzahl findest du bei jedem Event. Berücksichtige die Anzahl der Likes für Empfehlungen und markiere besonders beliebte Events passend.
Hier die Events:
${JSON.stringify(filteredEvents, null, 2)}`;

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    console.log('[ai-event-chat] Sending request to Open Router API with Gemini model...');

    const payload = {
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: query
        }
      ],
      temperature: 0.3,
      max_tokens: 1024
    };

    console.log(`[ai-event-chat] Full payload being sent: ${JSON.stringify(payload)}`);

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://1560d05e-bee8-486f-a5f8-4767a1bcbcde.lovableproject.com',
        'X-Title': 'THE TRIBE Event Chat'
      },
      body: JSON.stringify(payload)
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[ai-event-chat] OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`);
    }

    const aiResponse = await openRouterResponse.json();
    console.log('[ai-event-chat] Received response from OpenRouter API');

    const responseContent = aiResponse.choices?.[0]?.message?.content || 'Entschuldige, ich konnte keine Antwort generieren.';

    return new Response(JSON.stringify({
      response: responseContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-event-chat] Error:', error);
    return new Response(JSON.stringify({
      response: `<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">
        Es ist ein Fehler aufgetreten: ${error.message}. 
        Bitte versuche es später noch einmal.
      </div>`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
