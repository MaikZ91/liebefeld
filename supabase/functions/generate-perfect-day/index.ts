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

    // NEU: Request Body für Wetter und Interessen/Orte parsen
    const { weather: clientWeather, username: clientUsername, interests: clientInterests, favorite_locations: clientLocations } = await req.json();
    const currentWeather = clientWeather || 'partly_cloudy'; // Fallback
    const today = new Date().toISOString().split('T')[0];

    // --- On-demand request handling (from client) ---
    if (clientUsername) {
      console.log(`[generate-perfect-day] On-demand request for user: ${clientUsername}`);

      // Fetch user profile based on clientUsername
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', clientUsername)
        .single();

      if (profileError) {
        console.error(`[generate-perfect-day] Error fetching profile for ${clientUsername}:`, profileError);
        return new Response(
          JSON.stringify({ error: `Failed to fetch user profile: ${profileError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      // Get activity suggestions based on client's interests and weather
      const userInterests = profile?.interests || clientInterests || []; // Prioritize profile, then client data
      const userFavoriteLocations = profile?.favorite_locations || clientLocations || []; // Prioritize profile, then client data

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
          console.log(`[generate-perfect-day] Found ${activitySuggestions.length} activity suggestions for ${clientUsername}`);
        }
      }

      // Generate AI-powered perfect day message
      const aiMessage = await generatePerfectDayMessage(
        todaysEvents || [],
        profile, // Pass the fetched profile
        currentWeather,
        today,
        activitySuggestions
      );

      console.log(`[generate-perfect-day] Generated AI message for on-demand user: ${clientUsername}`);

      // Return the generated message directly
      return new Response(
        JSON.stringify({ response: aiMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Background job handling (if no username in request body) ---
    console.log('[generate-perfect-day] Processing as background job (no username in request body).');

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('perfect_day_subscriptions')
      .select('*')
      .eq('is_active', true)
      .or(`last_sent_at.is.null,last_sent_at.lt.${today}`);

    if (subError) {
      console.error('[generate-perfect-day] Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`[generate-perfect-day] Found ${subscriptions?.length || 0} active subscriptions`);

    // Get today's events (already fetched for on-demand, but re-fetch for clarity if this path is taken)
    const { data: todaysEventsBackground, error: eventsErrorBackground } = await supabase
      .from('community_events')
      .select('*')
      .eq('date', today)
      .order('time', { ascending: true });

    if (eventsErrorBackground) {
      console.error('[generate-perfect-day] Error fetching events for background job:', eventsErrorBackground);
    }

    console.log(`[generate-perfect-day] Found ${todaysEventsBackground?.length || 0} events for today for background job`);

    // Process each subscription
    for (const subscription of subscriptions || []) {
      try {
        console.log(`[generate-perfect-day] Processing subscription for ${subscription.username}`);

        // Get user profile for personalization
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', subscription.username)
          .single();

        if (profileError) {
          console.error(`[generate-perfect-day] Error fetching profile for ${subscription.username}:`, profileError);
          continue;
        }

        // Get activity suggestions based on user interests and weather
        const userInterests = profile?.interests || [];
        const userFavoriteLocations = profile?.favorite_locations || [];

        let activitySuggestions: any[] = [];
        if (userInterests.length > 0) {
          const { data: suggestions, error: suggestionsError } = await supabase
            .from('activity_suggestions')
            .select('activity, category, link')
            .in('category', userInterests)
            .or(`weather.eq.${currentWeather},weather.eq.sunny,weather.eq.cloudy`);

          if (suggestionsError) {
            console.error('[generate-perfect-day] Error fetching activity suggestions for background job:', suggestionsError);
          } else {
            activitySuggestions = suggestions || [];
            console.log(`[generate-perfect-day] Found ${activitySuggestions.length} activity suggestions for ${subscription.username} (background)`);
          }
        }

        // Generate AI-powered perfect day message
        const aiMessage = await generatePerfectDayMessage(
          todaysEventsBackground || [],
          profile,
          currentWeather,
          today,
          activitySuggestions
        );

        console.log(`[generate-perfect-day] Generated AI message for ${subscription.username}`);

        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            group_id: 'general',
            sender: 'Perfect Day Bot',
            text: aiMessage,
            avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`[generate-perfect-day] Error inserting message for ${subscription.username}:`, insertError);
          continue;
        }

        const { error: updateError } = await supabase
          .from('perfect_day_subscriptions')
          .update({ last_sent_at: today })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`[generate-perfect-day] Error updating subscription for ${subscription.username}:`, updateError);
        } else {
          console.log(`[generate-perfect-day] Successfully processed ${subscription.username}`);
        }

      } catch (error) {
        console.error(`[generate-perfect-day] Error processing subscription for ${subscription.username}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: subscriptions?.length || 0,
        events_found: todaysEventsBackground?.length || 0,
      }),
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
  events: any[],
  userProfile: any,
  weather: string,
  date: string,
  activitySuggestions: any[]
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

🌞 **Nachmittag** [Aktivitäten und Events]

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

    if (userProfile?.interests && userProfile.interests.length > 0) {
      userPrompt += ` Meine Interessen: ${userProfile.interests.join(', ')}.`;
      systemPrompt += `\n\nNutzer-Interessen: ${userProfile.interests.join(', ')} - berücksichtige diese bei den Empfehlungen.`;
    }

    if (userProfile?.favorite_locations && userProfile.favorite_locations.length > 0) {
      userPrompt += ` Bevorzugte Orte: ${userProfile.favorite_locations.join(', ')}.`;
      systemPrompt += `\n\nBevorzugte Orte: ${userProfile.favorite_locations.join(', ')} - bevorzuge Events an diesen Orten.`;
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