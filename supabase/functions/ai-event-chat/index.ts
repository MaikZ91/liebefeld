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
    const { query, timeOfDay, weather, allEvents, currentDate, nextWeekStart, nextWeekEnd } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Log basic date info
    console.log('Server current date:', today);
    console.log('Received currentDate:', currentDate, 'nextWeekRange:', nextWeekStart, nextWeekEnd);

    // Fetch events
    const { data: dbEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });
    if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);
    const events = (allEvents && allEvents.length > 0) ? allEvents : dbEvents;
    console.log('Number of events:', events.length);

    // Prepare events for context
    const formattedEvents = events.map(event => `
      Event: ${event.title}\n      Datum: ${event.date}\n      Zeit: ${event.time}\n      Kategorie: ${event.category}\n      ${event.location ? `Ort: ${event.location}` : ''}\n    `).join('\n');

    const systemMessage = `Du bist ein Event-Assistent für Liebefeld. Aktuelles Datum: ${today}. Hier die Events:\n${formattedEvents}`;

    console.log('Sending request to OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const status = response.status;
    const statusText = response.statusText;
    const headersObj = Object.fromEntries(response.headers.entries());
    const raw = await response.text();

    console.log('OpenRouter HTTP Status:', status, statusText);
    console.log('OpenRouter Response Headers:', headersObj);
    console.log('OpenRouter Raw Body:', raw);

    let data;
    try {
      data = JSON.parse(raw);
      console.log('OpenRouter Parsed JSON:', data);
    } catch (err) {
      console.error('Failed to parse JSON from OpenRouter:', err);
      throw new Error('Invalid JSON response from OpenRouter API');
    }

    // Validate structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid response structure, missing choices:', data);
      throw new Error('Invalid response structure from OpenRouter API');
    }
    const message = data.choices[0].message;
    if (!message) {
      console.error('Invalid response structure, missing message:', data);
      throw new Error('Invalid response structure from OpenRouter API');
    }

    const aiContent = message.content ?? JSON.stringify(message.function_call);
    console.log('Extracted AI content:', aiContent);

    return new Response(JSON.stringify({ response: aiContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const userErrorHtml = `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
        <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der Verarbeitung:</h5>
        <p class="text-sm mt-2">${errorMessage}</p>
      </div>
    `;
    return new Response(JSON.stringify({ response: userErrorHtml }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  });
  }
});
