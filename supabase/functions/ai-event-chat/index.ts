
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get request data
    const { query, timeOfDay, weather } = await req.json();
    
    // Fetch all events from the database
    const { data: events, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    // Format events data for the AI
    const formattedEvents = events.map(event => `
      Event: ${event.title}
      Datum: ${event.date}
      Zeit: ${event.time}
      Kategorie: ${event.category}
      ${event.location ? `Ort: ${event.location}` : ''}
      ${event.description ? `Beschreibung: ${event.description}` : ''}
    `).join('\n\n');

    // Prepare system message with context
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
    
    Format deine Antworten klar und übersichtlich.`;

    console.log('Sending request to Open Router API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/lovable-chat', 
        'X-Title': 'Lovable Chat'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`Open Router API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
