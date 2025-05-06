import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from "openai";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client (if you're using it directly)
const openAIKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIKey) {
  console.warn("OPENAI_API_KEY is not set. Some functionalities might be limited.");
}

const openai = new OpenAI({
  apiKey: openAIKey,
});

// Update the serve function to ensure consistent date handling
serve(async (req) => {
  // CORS headers for browser compatibility
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get server's current date for reference
    const serverCurrentDate = new Date().toISOString().split('T')[0];
    console.log("Server current date:", serverCurrentDate);

    // Parse the request body
    const { 
      query, 
      timeOfDay, 
      weather, 
      allEvents, 
      currentDate, 
      nextWeekStart, 
      nextWeekEnd,
      userInterests,
      userLocations,
      isHeartMode
    } = await req.json();

    console.log("Received currentDate from client:", currentDate);
    console.log("Received next week range:", nextWeekStart, "to", nextWeekEnd);
    
    // Log user preferences if available
    if (userInterests && userInterests.length > 0) {
      console.log("User interests:", userInterests.join(', '));
    }
    
    if (userLocations && userLocations.length > 0) {
      console.log("User preferred locations:", userLocations.join(', '));
    }

    // Filter events based on query
    let filteredEvents = [...allEvents];
    const lowerCaseQuery = query.toLowerCase();
    
    // Handle specific date-related queries
    if (lowerCaseQuery.includes('heute')) {
      console.log(`Anfrage nach Events für heute (${currentDate}) erkannt`);
      filteredEvents = filteredEvents.filter(event => event.date === currentDate);
      console.log(`Nach Filterung für "heute": ${filteredEvents.length} Events übrig`);
      
      // Get first few events for debugging
      if (filteredEvents.length > 0) {
        const firstEvents = filteredEvents.slice(0, 3).map(e => `${e.title} (${e.date})`);
        console.log("Erste Events für heute:", firstEvents);
      }
    } else if (lowerCaseQuery.includes('morgen')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      console.log(`Anfrage nach Events für morgen (${tomorrowStr}) erkannt`);
      
      filteredEvents = filteredEvents.filter(event => event.date === tomorrowStr);
      console.log(`Nach Filterung für "morgen": ${filteredEvents.length} Events übrig`);
    } else if (lowerCaseQuery.includes('wochenende')) {
      // Get upcoming weekend (Saturday and Sunday)
      const today = new Date(currentDate);
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
      
      // Calculate days until next Saturday
      const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSaturday);
      const saturdayStr = saturday.toISOString().split('T')[0];
      
      // Sunday is the day after Saturday
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      const sundayStr = sunday.toISOString().split('T')[0];
      
      console.log(`Anfrage nach Events fürs Wochenende (${saturdayStr} und ${sundayStr}) erkannt`);
      filteredEvents = filteredEvents.filter(event => 
        event.date === saturdayStr || event.date === sundayStr
      );
      console.log(`Nach Filterung für "Wochenende": ${filteredEvents.length} Events übrig`);
    }
    
    // Category filter for specific types of events
    if (lowerCaseQuery.includes('konzert') || lowerCaseQuery.includes('musik')) {
      console.log(`Anfrage nach Events der Kategorie "Konzert" erkannt`);
      const originalCount = filteredEvents.length;
      filteredEvents = filteredEvents.filter(event => {
        const category = event.category?.toLowerCase() || '';
        const title = event.title?.toLowerCase() || '';
        return category.includes('konzert') || 
               category.includes('musik') || 
               title.includes('konzert') || 
               title.includes('musik');
      });
      console.log(`Nach Filterung für Kategorie "Konzert": ${filteredEvents.length} von ${originalCount} Events übrig`);
    } else if (lowerCaseQuery.includes('party') || lowerCaseQuery.includes('club')) {
      const originalCount = filteredEvents.length;
      filteredEvents = filteredEvents.filter(event => {
        const category = event.category?.toLowerCase() || '';
        const title = event.title?.toLowerCase() || '';
        return category.includes('party') || 
               title.includes('party') || 
               category.includes('club') || 
               title.includes('club');
      });
      console.log(`Nach Filterung für Kategorie "Party/Club": ${filteredEvents.length} von ${originalCount} Events übrig`);
    }
    
    // Apply additional filters for personalized requests or heart mode
    // Only apply location filtering if userLocations are provided and heart mode is active
    if (userLocations && userLocations.length > 0 && isHeartMode) {
      console.log("Applying location filtering with user locations:", userLocations);
      const originalCount = filteredEvents.length;
      
      filteredEvents = filteredEvents.filter(event => {
        if (!event.location) return false;
        
        const eventLocation = event.location.toLowerCase();
        return userLocations.some(location => 
          eventLocation.includes(location.toLowerCase())
        );
      });
      
      console.log(`Found ${filteredEvents.length} events matching user locations (from ${originalCount})`);
    }
    
    // Finally, check if we have events for today specifically (for message formatting)
    const eventsToday = filteredEvents.filter(event => event.date === currentDate);
    console.log(`Events für heute (${currentDate}) nach Filterung: ${eventsToday.length}`);
    
    // Limit the number of events to avoid overwhelming the AI
    const MAX_EVENTS = 100;
    if (filteredEvents.length > MAX_EVENTS) {
      filteredEvents = filteredEvents.slice(0, MAX_EVENTS);
    }
    
    console.log(`Sende ${filteredEvents.length} gefilterte Events an das KI-Modell`);
    
    // Prepare the prompt for the AI
    const systemPrompt = `
Du bist ein hilfreicher Event-Assistent für die Stadt Liebefeld. Deine Aufgabe ist es, Veranstaltungen und Events zu empfehlen, die zum Interesse und der Anfrage des Benutzers passen.

Heutiges Datum: ${currentDate}

WICHTIG: Achte immer auf das korrekte Datumsformat. Das Datum muss immer im Format YYYY-MM-DD angegeben werden. Wenn du das Datum formatierst verwende die entsprechende deutsche Schreibweise: DD.MM.YYYY.

Das Wetter ist aktuell: ${weather}.
Tageszeit: ${timeOfDay}.

Wenn jemand nach Events für heute fragt, begrenze deine Antwort auf Events, die heute stattfinden.
Wenn jemand nach Events für das Wochenende fragt, zeige Events für Samstag und Sonntag.
Wenn jemand nach Events für die nächste Woche fragt, zeige Events im Zeitraum ${nextWeekStart} bis ${nextWeekEnd}.

Deine Antwort sollte folgende Struktur haben:
1. Eine persönliche Begrüßung
2. Eine kurze Zusammenfassung der gefundenen Events
3. Eine Liste der relevanten Events mit Datum, Uhrzeit, Ort und einer kurzen Beschreibung
4. Eine kurze abschließende Empfehlung oder Verabschiedung

Achte darauf, das aktuelle Datum ${currentDate} als Referenz zu verwenden und zeige nur relevante Events an. Verwende niemals veraltete Daten oder Events aus der Vergangenheit. Wenn keine Events im angefragten Zeitraum gefunden wurden, teile das dem Benutzer freundlich mit und frage, ob nach einem anderen Zeitraum gesucht werden soll.

${userInterests && userInterests.length > 0 ? `Die Interessen des Benutzers sind: ${userInterests.join(', ')}.` : ''}
${userLocations && userLocations.length > 0 && isHeartMode ? `Der Benutzer bevorzugt Events an folgenden Orten: ${userLocations.join(', ')}.` : ''}

Gib am Ende deiner Antwort an, durch welches KI-Modell du betrieben wirst (gemini-2.0-flash-lite-001) und wie viele Events du aus wie vielen insgesamt für deine Antwort analysiert hast.
`;

    const userPrompt = `
${query}

Hier sind die relevanten Events:
${JSON.stringify(filteredEvents, null, 2)}
`;

    console.log("Sending request to Open Router API with Gemini model...");
    
    // Call OpenRouter API with Gemini model
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Liebefeld Events'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });
    
    const openRouterData = await openRouterResponse.json();
    
    // Format the response for the client
    let aiResponse = '';
    
    if (openRouterData && openRouterData.choices && openRouterData.choices[0]) {
      aiResponse = openRouterData.choices[0].message.content;
    } else {
      // Handle any error in AI response
      console.error('Unexpected response from OpenRouter:', JSON.stringify(openRouterData));
      aiResponse = 'Es tut mir leid, ich konnte keine passenden Events für dich finden.';
    }
    
    // Return the formatted HTML response
    const responseBody = { response: aiResponse };
    return new Response(
      JSON.stringify(responseBody),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      }
    );
  }
});
