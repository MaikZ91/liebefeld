
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://deno.land/x/supabase@1.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city } = await req.json();
    
    if (!city) {
      return new Response(JSON.stringify({ error: 'City parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!openRouterApiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating events for city: ${city}`);

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Du bist ein lokaler Event-Experte. Erstelle mir eine Liste von 5-8 realistischen Events, die heute (${today}) in ${city}, Deutschland stattfinden könnten.

Für jedes Event, gib mir folgende Informationen im JSON Format zurück:
- title: Event-Name (max 100 Zeichen)
- description: Kurze Beschreibung (max 300 Zeichen)
- time: Uhrzeit im Format "HH:MM" (z.B. "19:30")
- location: Venue/Ort Name
- category: Eine von: "Konzert", "Party", "Ausstellung", "Sport", "Workshop", "Kultur", "Sonstiges", "Networking"
- organizer: Name des Veranstalters (falls bekannt, sonst "Unbekannt")

Achte darauf dass die Events realistisch und vielfältig sind (verschiedene Kategorien, Uhrzeiten). Antworte NUR mit einem JSON Array, ohne zusätzlichen Text.

Beispiel Format:
[
  {
    "title": "Jazz Abend im Café Mokka",
    "description": "Entspannter Jazz mit lokalen Musikern bei Kaffee und Wein",
    "time": "20:00",
    "location": "Café Mokka",
    "category": "Konzert",
    "organizer": "Café Mokka"
  }
]`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let events;
    try {
      events = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(events)) {
      console.error('AI response is not an array:', events);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Parsed ${events.length} events from AI`);

    // Insert events into database
    const insertedEvents = [];
    
    for (const event of events) {
      try {
        const { data: insertedEvent, error } = await supabase
          .from('community_events')
          .insert({
            title: event.title,
            description: event.description || '',
            date: today,
            time: event.time || '19:00',
            location: event.location || '',
            city: city,
            organizer: event.organizer || 'Unbekannt',
            category: event.category || 'Sonstiges',
            source: 'ai_generated',
            likes: 0,
            rsvp_yes: 0,
            rsvp_no: 0,
            rsvp_maybe: 0,
            is_paid: false
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting event:', error);
        } else {
          insertedEvents.push(insertedEvent);
          console.log('Successfully inserted event:', insertedEvent.title);
        }
      } catch (insertError) {
        console.error('Exception inserting event:', insertError);
      }
    }

    console.log(`Successfully inserted ${insertedEvents.length} events for ${city}`);

    return new Response(JSON.stringify({ 
      success: true, 
      city: city,
      eventsGenerated: insertedEvents.length,
      events: insertedEvents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-city-events function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
