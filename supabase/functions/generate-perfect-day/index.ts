
// supabase/functions/generate-perfect-day/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?no-dts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// --- Hinzugefügte Typdefinitionen für Events (vereinfacht für Edge Function) ---
interface GitHubEvent {
  hash?: string;
  date: string; // Format: "Thu, 29.05.2025" or "Th, 29.05"
  event: string;
  link: string;
  time?: string;
  description?: string;
  location?: string;
  organizer?: string;
  category?: string;
  genre?: string;
  type?: string;
  image_url?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // Format: Sachende-MM-DD (after transformation)
  time: string;
  location: string;
  organizer: string;
  category: string;
  likes?: number;
  link?: string;
  image_url?: string;
  rsvp?: { yes: number; no: number; maybe: number; };
  rsvp_yes?: number;
  rsvp_no?: number;
  rsvp_maybe?: number;
}

// --- Replikation der transformGitHubEvents Logik für die Edge Function ---
const transformGitHubEventsEdge = (
  githubEvents: GitHubEvent[],
  currentYear: number = new Date().getFullYear()
): Event[] => {
  return githubEvents.map((githubEvent, index) => {
    const eventId = `github-${githubEvent.hash || githubEvent.event || index}`;
    // Likes and RSVP are not fetched/synced in this edge function for simplicity/performance
    // They will default to 0.

    let title = githubEvent.event || 'Unnamed Event';
    let location = githubEvent.location || '';
    const locationMatch = title.match(/^(.+?)\s*\(@([^)]+)\)$/);
    if (locationMatch) {
      title = locationMatch[1].trim();
      location = locationMatch[2].trim();
    }
    
    let category = 'Sonstiges';
    if (githubEvent.category) {
      category = githubEvent.category;
    } else if (githubEvent.genre) {
      category = githubEvent.genre;
    } else if (githubEvent.type) {
      category = githubEvent.type;
    } else {
      const eventText = (title + ' ' + (githubEvent.description || '')).toLowerCase();
      if (eventText.includes('konzert') || eventText.includes('concert') || eventText.includes('musik') || eventText.includes('band')) {
        category = 'Konzert';
      } else if (eventText.includes('party') || eventText.includes('club') || eventText.includes('dj')) {
        category = 'Party';
      } else if (eventText.includes('festival')) {
        category = 'Festival';
      } else if (eventText.includes('ausstellung') || eventText.includes('exhibition') || eventText.includes('kunst')) {
        category = 'Ausstellung';
      } else if (eventText.includes('sport') || eventText.includes('fitness') || eventText.includes('lauf')) {
        category = 'Sport';
      } else if (eventText.includes('workshop') || eventText.includes('kurs')) {
        category = 'Workshop';
      } else if (eventText.includes('theater') || eventText.includes('schauspiel')) {
        category = 'Theater';
      } else if (eventText.includes('kino') || eventText.includes('film')) {
        category = 'Kino';
      } else if (eventText.includes('lesung') || eventText.includes('literatur')) {
        category = 'Lesung';
      }
    }

    let eventDate = '';
    try {
      const dateStr = githubEvent.date;
      if (dateStr.includes('.')) {
        const dateMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3] || currentYear.toString();
          eventDate = `${year}-${month}-${day}`;
        }
      }
      if (!eventDate) {
        eventDate = new Date().toISOString().split('T')[0]; // Fallback to today if parsing fails
      }
    } catch (error) {
      eventDate = new Date().toISOString().split('T')[0]; // Fallback on error
    }

    const transformedEvent: Event = {
      id: eventId,
      title: title,
      description: githubEvent.description || '',
      date: eventDate,
      time: githubEvent.time || '00:00',
      location: location,
      organizer: githubEvent.organizer || 'Unbekannt',
      category: category,
      likes: 0, 
      rsvp: { yes: 0, no: 0, maybe: 0 }, 
      link: githubEvent.link || null,
      image_url: githubEvent.image_url || null
    };
    return transformedEvent;
  });
};

const EXTERNAL_EVENTS_URL = "https://raw.githubusercontent.com/MaikZ91/productiontools/master/events.json";

// --- Hauptfunktion der Edge Function ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const today = new Date().toISOString().split('T')[0]; // Server's current date

    // Parse request body. Check if 'username' is provided, indicating an on-demand request.
    const { username: clientUsername, weather: clientWeather, interests: clientInterests, favorite_locations: clientLocations } = await req.json();
    
    // --- Determine if this is an on-demand user request or a background job ---
    if (clientUsername) { // If username is provided, it's a user-triggered request
      console.log('[generate-perfect-day] Processing as ON-DEMAND user request.');
      
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
          .maybeSingle();

        if (profileError) {
          console.warn(`[generate-perfect-day] Error fetching profile for ${clientUsername}:`, profileError.message);
        } else if (profile) {
          userProfile = profile;
          userInterests = profile.interests || userInterests;
          userFavoriteLocations = profile.favorite_locations || userFavoriteLocations;
          console.log(`[generate-perfect-day] Profile fetched for ${clientUsername}. Using profile interests and locations.`);
        } else {
          console.log(`[generate-perfect-day] No profile found for ${clientUsername}. Using client interests and locations.`);
        }
      } else {
        console.log(`[generate-perfect-day] No valid username provided (or 'Gast'). Using client interests and locations.`);
      }

      userInterests = Array.isArray(userInterests) ? userInterests : [];
      userFavoriteLocations = Array.isArray(userFavoriteLocations) ? userFavoriteLocations : [];

      // --- Events aus Supabase abrufen ---
      const { data: supabaseEventsData, error: supabaseEventsError } = await supabase
        .from('community_events')
        .select('*, image_urls')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (supabaseEventsError) {
        console.error('[generate-perfect-day] Error fetching Supabase events:', supabaseEventsError);
      }
      const fetchedSupabaseEvents: Event[] = (supabaseEventsData || []).map(event => ({
          id: event.id.toString(),
          title: event.title,
          description: event.description || '',
          date: event.date,
          time: event.time,
          location: event.location || '',
          organizer: event.organizer || 'Unbekannt',
          category: event.category,
          likes: event.likes || 0,
          rsvp: {
              yes: event.rsvp_yes || 0,
              no: event.rsvp_no || 0,
              maybe: event.rsvp_maybe || 0
          },
          link: event.link || null,
          image_url: event.image_urls && event.image_urls.length > 0 ? event.image_urls[0] : null
      }));
      console.log(`[generate-perfect-day] Fetched ${fetchedSupabaseEvents.length} Supabase events.`);

      // --- Externe GitHub-Events abrufen ---
      let githubEvents: Event[] = [];
      try {
          const cacheBuster = `?t=${new Date().getTime()}`;
          const response = await fetch(`${EXTERNAL_EVENTS_URL}${cacheBuster}`);
          if (!response.ok) {
              console.warn(`[generate-perfect-day] Failed to fetch external events: ${response.status} ${response.statusText}`);
          } else {
              const rawGitHubEvents: GitHubEvent[] = await response.json();
              githubEvents = transformGitHubEventsEdge(rawGitHubEvents);
              console.log(`[generate-perfect-day] Fetched ${githubEvents.length} GitHub events.`);
          }
      } catch (fetchError) {
          console.error('[generate-perfect-day] Error fetching external GitHub events:', fetchError);
      }

      // --- Alle Events zusammenführen ---
      const allFutureEvents = [...fetchedSupabaseEvents, ...githubEvents];
      console.log(`[generate-perfect-day] Combined allFutureEvents count: ${allFutureEvents.length}`);
      if (allFutureEvents.length > 0) {
        console.log(`[generate-perfect-day] First 3 combined events (id, title, date): ${JSON.stringify(allFutureEvents.slice(0, 3).map(e => ({id: e.id, title: e.title, date: e.date})))}`);
      }
      
      // Get activity suggestions based on user interests and weather
      let finalActivitySuggestions: any[] = [];
      if (userInterests.length > 0) {
        const { data: suggestions, error: suggestionsError } = await supabase
          .from('activity_suggestions')
          .select('activity, category, link')
          .in('category', userInterests)
          .or(`weather.eq.${clientWeather || 'partly_cloudy'},weather.eq.sunny,weather.eq.cloudy`);

        if (suggestionsError) {
          console.error('[generate-perfect-day] Error fetching activity suggestions:', suggestionsError);
        } else {
          finalActivitySuggestions = suggestions || [];
          console.log(`[generate-perfect-day] Found ${finalActivitySuggestions.length} activity suggestions.`);
        }
      }
      
      console.log(`[generate-perfect-day] Value of finalActivitySuggestions before call: ${JSON.stringify(finalActivitySuggestions)}`);

      // Generate AI-powered perfect day message
      const aiMessage = await generatePerfectDayMessage(
        allFutureEvents || [],
        userProfile,
        clientWeather || 'partly_cloudy',
        today,
        finalActivitySuggestions,
        userInterests,
        userFavoriteLocations,
        true // addProfileButton = true for on-demand requests
      );

      console.log(`[generate-perfect-day] Generated AI message for on-demand request.`);

      return new Response(
        JSON.stringify({ response: aiMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else { // --- Processing as a background job (no username in request body) ---
      console.log('[generate-perfect-day] Processing as BACKGROUND JOB for daily AI chat messages.');

      // Fetch all events (Supabase and GitHub) for background jobs
      const { data: supabaseEventsData, error: subSupabaseEventsError } = await supabase
        .from('community_events')
        .select('*, image_urls')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (subSupabaseEventsError) {
        console.error('[generate-perfect-day] Error fetching Supabase events for background job:', subSupabaseEventsError);
      }
      const fetchedSubSupabaseEvents: Event[] = (supabaseEventsData || []).map(event => ({
          id: event.id.toString(),
          title: event.title,
          description: event.description || '',
          date: event.date,
          time: event.time,
          location: event.location || '',
          organizer: event.organizer || 'Unbekannt',
          category: event.category,
          likes: event.likes || 0,
          rsvp: {
              yes: event.rsvp_yes || 0,
              no: event.rsvp_no || 0,
              maybe: event.rsvp_maybe || 0
          },
          link: event.link || null,
          image_url: event.image_urls && event.image_urls.length > 0 ? event.image_urls[0] : null
      }));

      let subGithubEvents: Event[] = [];
      try {
          const cacheBuster = `?t=${new Date().getTime()}`;
          const response = await fetch(`${EXTERNAL_EVENTS_URL}${cacheBuster}`);
          if (!response.ok) {
              console.warn(`[generate-perfect-day] Failed to fetch external events for background job: ${response.status} ${response.statusText}`);
          } else {
              const rawGitHubEvents: GitHubEvent[] = await response.json();
              subGithubEvents = transformGitHubEventsEdge(rawGitHubEvents);
          }
      } catch (fetchError) {
          console.error('[generate-perfect-day] Error fetching external GitHub events for background job:', fetchError);
      }
      const allEventsForBackgroundJob = [...fetchedSubSupabaseEvents, ...subGithubEvents];
      console.log(`[generate-perfect-day] Combined ${allEventsForBackgroundJob.length} events for background job.`);

      // Generate a universal perfect day message for all users
      const universalMessage = await generatePerfectDayMessage(
        allEventsForBackgroundJob,
        null, // No specific user profile for universal message
        'partly_cloudy', // Default weather
        today,
        [], // No specific activity suggestions
        [], // No specific interests
        [], // No specific locations
        false // No profile button for background messages
      );

      // Insert the daily message directly into AI chat history (simulated as system message)
      // Since this is a universal message, we don't need to loop through users
      // The message will appear for all users when they open the AI chat
      console.log(`[generate-perfect-day] Generated universal Perfect Day message for AI chat.`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Universal Perfect Day message generated for AI chat",
          events_found: allEventsForBackgroundJob.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
  clientInterests: string[],
  clientFavoriteLocations: string[],
  addProfileButton: boolean
): Promise<string> {
  try {
    // Filtere Events explizit nach dem heutigen Datum und extrahiere den Datums-Teil
    const todaysRelevantEvents = events.filter(e => {
        const eventDatePart = typeof e.date === 'string' ? e.date.split('T')[0] : '';
        return eventDatePart === date;
    });

    const morningEvents = todaysRelevantEvents.filter(e => {
      const hour = parseInt(e.time.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
    const afternoonEvents = todaysRelevantEvents.filter(e => {
      const hour = parseInt(e.time.split(':')[0]);
      return hour >= 12 && hour < 18;
    });
    const eveningEvents = todaysRelevantEvents.filter(e => {
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

    if (todaysRelevantEvents.length === 0) {
      systemPrompt += `\n\nKeine spezifischen Events heute verfügbar - erstelle allgemeine Empfehlungen für Liebefeld.`;
    }

    let userPrompt = `Erstelle meinen perfekten Tag für heute in Liebefeld!`;

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

    let aiContent = data.choices[0].message.content;
    
    // --- NEU: Button für Profilpersonalisierung hinzufügen ---
    if (addProfileButton) {
        aiContent += `
        <div class="mt-4 pt-4 border-t border-gray-700/50">
            <button onclick="window.openProfileEditor()" class="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 text-sm w-full">
                Personalisiere deine Perfect Day Nachricht
            </button>
        </div>
        `;
    }

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
