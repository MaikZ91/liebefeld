// supabase/functions/generate-perfect-day/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[generate-perfect-day] Starting perfect day generation...');

    const { weather: clientWeather, username: clientUsername, interests: clientInterests, favorite_locations: clientLocations } = await req.json();
    const currentWeather = clientWeather || 'partly_cloudy'; // Fallback
    const today = new Date().toISOString().split('T')[0];

    let userProfile: any | null = null;
    let userInterests: string[] = clientInterests || [];
    let userFavoriteLocations: string[] = clientLocations || [];

    // Only attempt to fetch a profile if a valid username (not 'Gast' or empty) is provided
    if (clientUsername && clientUsername !== 'Gast') {
      console.log(`[generate-perfect-day] Attempting to fetch profile for user: ${clientUsername}`);
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', clientUsername)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (profileError) {
        console.warn(`[generate-perfect-day] Error fetching profile for ${clientUsername}:`, profileError.message);
        // Do not throw, continue with client-provided or default interests/locations
      } else if (profile) {
        userProfile = profile;
        userInterests = profile.interests || userInterests; // Prioritize profile data
        userFavoriteLocations = profile.favorite_locations || userFavoriteLocations; // Prioritize profile data
        console.log(`[generate-perfect-day] Profile fetched for ${clientUsername}. Using profile interests and locations.`);
      } else {
        console.log(`[generate-perfect-day] No profile found for ${clientUsername}. Using client interests and locations.`);
      }
    } else {
      console.log(`[generate-perfect-day] No valid username provided (or 'Gast'). Using client interests and locations.`);
    }

    // Ensure interests and locations are arrays, even if null from DB/client
    userInterests = Array.isArray(userInterests) ? userInterests : [];
    userFavoriteLocations = Array.isArray(userFavoriteLocations) ? userFavoriteLocations : [];

    // Get today's events
    const { data: todaysEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .eq('date', today)
      .order('time', { ascending: true });

    if (eventsError) {
      console.error('[generate-perfect-day] Error fetching events:', eventsError);
      // Continue without events
    }

    // Get activity suggestions based on user interests and weather
    let activitySuggestions: any[] = [];
    if (userInterests.length > 0) {
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('activity_suggestions')
        .select('activity, category, link')
        .in('category', userInterests) // Filter by user interests
        .or(`weather.eq.${currentWeather},weather.eq.sunny,weather.eq.cloudy`); // Broad weather match

      if (suggestionsError) {
        console.error('[generate-perfect-day] Error fetching activity suggestions:', suggestionsError);
      } else {
        activitySuggestions = suggestions || [];
        console.log(`[generate-perfect-day] Found ${activitySuggestions.length} activity suggestions.`);
      }
    }

    // Generate AI-powered perfect day message
    const aiMessage = await generatePerfectDayMessage(
      todaysEvents || [],
      userProfile, // Pass the fetched profile (might be null)
      currentWeather,
      today,
      activitySuggestions,
      userInterests, // Pass potentially updated user interests
      userFavoriteLocations // Pass potentially updated user favorite locations
    );

    console.log(`[generate-perfect-day] Generated AI message for on-demand request.`);

    // Return the generated message directly
    return new Response(
      JSON.stringify({ response: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
    // Die Hintergrundjob-Logik wird nur ausgeführt, wenn die Funktion nicht durch eine
    // Client-Anfrage beendet wird (was durch das obige `return` gewährleistet ist).
    // Siehe: [maikz91/liebefeld/MaikZ91-liebefeld-5f5a85b9c5bb9dd73ab94e688c64663dc70eead3/supabase/functions/generate-perfect-day/index.ts]

  } catch (error) {
    console.error('[generate-perfect-day] Error in generate-perfect-day function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generatePerfectDayMessage(
  events: any[],
  userProfile: any,
  weather: string,
  date: string,
  activitySuggestions: any[],
  clientInterests: string[], // Explicitly passed now
  clientFavoriteLocations: string[] // Explicitly passed now
): Promise<string> {
  try {
    const morningEvents = events.filter(e => {
      const hour = parseInt(e.time.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
    const afternoonEvents = events.filter(e => {
      const hour = parseInt(e.time.split(':')[0]);
      return hour >= 12 && hour < 18;
    });
    const eveningEvents = events.filter(e => {
      const hour = parseInt(e.time.split(':')[0]);
      return hour >= 18 || hour < 6;
    });

    const formatEventForPrompt = (event: any) => {
      return `${event.title} um ${event.time} (${event.location}, Kategorie: ${event.category})`;
    };

    let systemPrompt = `Du bist der Perfect Day Bot für Liebefeld. Erstelle eine persönliche Tagesempfehlung im Format:

🌟 **Dein perfekter Tag in Liebefeld!** 🌟

🌅 **Vormittag**
[Aktivitäten und Events]

🌞 **Nachmittag**
[Aktivitäten und Events]

🌙 **Abend**
[Aktivitäten und Events]

Wetter heute: [Wetterinfo]

Viel Spaß bei deinem perfekten Tag! 💫

Verfügbare Events heute (${date}):`;

    if (morningEvents.length > 0) {
      systemPrompt += `\n\nVormittag-Events:\n${morningEvents.map(formatEventForPrompt).join('\n')}`;
    }
    if (afternoonEvents.length > 0) {
      systemPrompt += `\n\nNachmittag-Events:\n${afternoonEvents.map(formatEventForPrompt).join('\n')}`;
    }
    if (eveningEvents.length > 0) {
      systemPrompt += `\n\nAbend-Events:\n${eveningEvents.map(formatEventForPrompt).join('\n')}`;
    }

    if (events.length === 0) {
      systemPrompt += `\n\nKeine spezifischen Events heute verfügbar - erstelle allgemeine Empfehlungen für Liebefeld.`;
    }

    let userPrompt = `Erstelle meinen perfekten Tag für heute in Liebefeld!`;

    // Use clientInterests and clientFavoriteLocations (which are guaranteed to be arrays)
    if (clientInterests && clientInterests.length > 0) {
      userPrompt += ` Meine Interessen: ${clientInterests.join(', ')}.`;
      systemPrompt += `\n\nNutzer-Interessen: ${clientInterests.join(', ')} - berücksichtige diese bei den Empfehlungen.`;
    }

    if (clientFavoriteLocations && clientFavoriteLocations.length > 0) {
      userPrompt += ` Bevorzugte Orte: ${clientFavoriteLocations.join(', ')}.`;
      systemPrompt += `\n\nBevorzugte Orte: ${clientFavoriteLocations.join(', ')} - bevorzuge Events an diesen Orten.`;
    }

    // Aktivitätsvorschläge in den System-Prompt integrieren
    if (activitySuggestions.length > 0) {
      systemPrompt += `\n\nZusätzliche Aktivitätsvorschläge basierend auf Interessen:`;
      activitySuggestions.forEach(s => {
        systemPrompt += `\n- ${s.activity} (Kategorie: ${s.category}, Link: ${s.link || 'Nicht vorhanden'})`;
      });
      systemPrompt += `\nBerücksichtige diese Vorschläge, wo sie zum perfekten Tag passen.`;
    }

    systemPrompt += `\n\nAktuelles Wetter: ${weather}.`;
    systemPrompt += `\n\nWichtig: Integriere die verfügbaren Events in deine Empfehlungen. Ergänze mit allgemeinen Aktivitäten wo keine Events verfügbar sind.`;

    console.log('[generate-perfect-day] Calling OpenRouter API...');

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('[generate-perfect-day] OpenRouter API error:', response.status, response.statusText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[generate-perfect-day] Invalid OpenRouter response:', data);
      throw new Error('Invalid response from OpenRouter API');
    }

    const aiContent = data.choices[0].message.content;
    console.log('[generate-perfect-day] Successfully generated AI content');
    
    return aiContent;

  } catch (error) {
    console.error('[generate-perfect-day] Error generating AI message:', error);
    
    const fallbackMessage = `🌟 **Dein perfekter Tag in Liebefeld!** 🌟

🌅 **Vormittag**: Beginne den Tag mit einem Spaziergang oder besuche ein Café

🌞 **Nachmittag**: Entdecke lokale Events oder entspanne im Park  

🌙 **Abend**: Genieße ein gemütliches Abendessen oder besuche ein Event

${events.length > 0 ? `\nHeute sind ${events.length} Events verfügbar!` : ''}

Viel Spaß bei deinem perfekten Tag! 💫`;

    return fallbackMessage;
  }
}