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

// Externe URL für GitHub-Events
const EXTERNAL_EVENTS_URL = "https://raw.githubusercontent.com/MaikZ91/productiontools/master/events.json";

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
    console.log(`[generate-perfect-day] Current server date (today): ${today}`);

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

    // Events aus Supabase abrufen (community_events)
    const { data: supabaseEvents, error: supabaseEventsError } = await supabase
      .from('community_events')
      .select('*, image_urls') // Stellen Sie sicher, dass image_urls ausgewählt werden
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (supabaseEventsError) {
      console.error('[generate-perfect-day] Error fetching Supabase events:', supabaseEventsError);
    }
    console.log(`[generate-perfect-day] Fetched Supabase events count: ${supabaseEvents?.length || 0}`);


    // GitHub Event Likes aus Supabase abrufen
    const { data: githubLikesData, error: githubLikesError } = await supabase
      .from('github_event_likes')
      .select('*');

    const githubLikesMap: Record<string, any> = {};
    if (githubLikesError) {
      console.warn('[generate-perfect-day] Error fetching GitHub likes:', githubLikesError);
    } else if (githubLikesData) {
      githubLikesData.forEach(like => {
        githubLikesMap[like.event_id] = {
          likes: like.likes || 0,
          rsvp_yes: like.rsvp_yes || 0,
          rsvp_no: like.rsvp_no || 0,
          rsvp_maybe: like.rsvp_maybe || 0
        };
      });
    }
    console.log(`[generate-perfect-day] Fetched GitHub likes count: ${Object.keys(githubLikesMap).length}`);


    // Externe GitHub Events abrufen und transformieren (Replikation der Logik von transformGitHubEvents)
    let externalEvents: any[] = [];
    try {
      const githubResponse = await fetch(EXTERNAL_EVENTS_URL);
      if (!githubResponse.ok) {
        throw new Error(`HTTP error! Status: ${githubResponse.status}`);
      }
      const rawGitHubEvents = await githubResponse.json();
      
      externalEvents = rawGitHubEvents.map((githubEvent: any, index: number) => {
        const eventId = `github-${githubEvent.hash || githubEvent.event || index}`;
        const likesData = githubLikesMap[eventId] || {};
        
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
              const year = dateMatch[3] || new Date().getFullYear().toString();
              eventDate = `${year}-${month}-${day}`;
            }
          }
          if (!eventDate) {
            eventDate = new Date().toISOString().split('T')[0];
          }
        } catch (error) {
          console.error(`Error parsing date for GitHub event ${title}:`, error);
          eventDate = new Date().toISOString().split('T')[0];
        }

        return {
          id: eventId,
          title: title,
          description: githubEvent.description || '',
          date: eventDate,
          time: githubEvent.time || '00:00',
          location: location,
          organizer: githubEvent.organizer || 'Unbekannt',
          category: category,
          likes: likesData.likes || 0,
          rsvp: {
            yes: likesData.rsvp_yes || 0,
            no: likesData.rsvp_no || 0,
            maybe: likesData.rsvp_maybe || 0
          },
          link: githubEvent.link || null,
          image_url: githubEvent.image_url || null
        };
      });
      console.log(`[generate-perfect-day] Fetched and transformed ${externalEvents.length} external events.`);
    } catch (githubFetchError) {
      console.error('[generate-perfect-day] Error fetching external events:', githubFetchError);
    }

    // Kombinieren der Events und Sicherstellen der Einzigartigkeit
    const combinedEventsMap = new Map();
    (supabaseEvents || []).forEach(event => {
      // Stellen Sie sicher, dass image_urls in image_url für das Event-Objekt konvertiert wird, falls vorhanden
      const formattedEvent = {
        ...event,
        image_url: event.image_urls && event.image_urls.length > 0 ? event.image_urls[0] : null
      };
      combinedEventsMap.set(formattedEvent.id, formattedEvent);
    });

    (externalEvents || []).forEach(event => {
        // Falls eine GitHub Event ID mit Supabase Events kollidiert, behalten wir die existierende,
        // aber aktualisieren die Likes/RSVP-Daten, falls der GitHub-Event neuer ist.
        // Für Einfachheit überschreiben wir erstmal nur.
        if (combinedEventsMap.has(event.id)) {
            const existingEvent = combinedEventsMap.get(event.id);
            combinedEventsMap.set(event.id, {
                ...existingEvent,
                // Aktualisiere Likes/RSVP nur wenn im neuen Event vorhanden und höher
                likes: event.likes !== undefined ? event.likes : existingEvent.likes,
                rsvp: event.rsvp || existingEvent.rsvp,
                rsvp_yes: event.rsvp_yes !== undefined ? event.rsvp_yes : existingEvent.rsvp_yes,
                rsvp_no: event.rsvp_no !== undefined ? event.rsvp_no : existingEvent.rsvp_no,
                rsvp_maybe: event.rsvp_maybe !== undefined ? event.rsvp_maybe : existingEvent.rsvp_maybe,
            });
        } else {
            combinedEventsMap.set(event.id, event);
        }
    });

    const allCombinedEvents = Array.from(combinedEventsMap.values());
    console.log(`[generate-perfect-day] Combined total events: ${allCombinedEvents.length}`);


    // Get activity suggestions based on user interests and weather
    let finalActivitySuggestions: any[] = [];
    if (userInterests.length > 0) {
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('activity_suggestions')
        .select('activity, category, link')
        .in('category', userInterests)
        .or(`weather.eq.${currentWeather},weather.eq.sunny,weather.eq.cloudy`);

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
      allCombinedEvents, // Alle kombinierten Events an die Nachrichten-Generierung übergeben
      userProfile,
      currentWeather,
      today,
      finalActivitySuggestions,
      userInterests,
      userFavoriteLocations
    );

    console.log(`[generate-perfect-day] Generated AI message for on-demand request.`);

    return new Response(
      JSON.stringify({ response: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
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
  events: any[], // Enthält nun alle kombinierten Events (Supabase + GitHub)
  userProfile: any,
  weather: string,
  date: string,
  activitySuggestions: any[],
  clientInterests: string[],
  clientFavoriteLocations: string[]
): Promise<string> {
  try {
    // Filtere Events explizit nach dem heutigen Datum und extrahiere den Datums-Teil
    const todaysRelevantEvents = events.filter(e => {
        const eventDatePart = typeof e.date === 'string' ? e.date.split('T')[0] : '';
        console.log(`[generatePerfectDayMessage] Comparing event date part '${eventDatePart}' with today '${date}'`);
        return eventDatePart === date;
    });
    console.log(`[generatePerfectDayMessage] Filtered todaysRelevantEvents count: ${todaysRelevantEvents.length}`);
    if (todaysRelevantEvents.length > 0) {
      console.log(`[generatePerfectDayMessage] First 3 todaysRelevantEvents: ${JSON.stringify(todaysRelevantEvents.slice(0, 3))}`);
    }

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