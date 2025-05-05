
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

// Definition der Function-Calling-Spezifikation
const functions = [
  {
    name: 'render_event_panel',
    description: 'Gibt eine Liste von Events als JSON-Array mit Datum, klickbarem Titel (mit URL) und Ort zurück',
    parameters: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date:    { type: 'string', format: 'date' },
              title:   {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  url:  { type: 'string', format: 'uri' }
                },
                required: ['text','url']
              },
              location:{ type: 'string' }
            },
            required: ['date','title','location']
          }
        }
      },
      required: ['events']
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { query, timeOfDay, weather, allEvents, currentDate, nextWeekStart, nextWeekEnd } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Datenbank-Events abrufen
    const { data: dbEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });
    if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);

    const events = (allEvents && allEvents.length > 0) ? allEvents : dbEvents;

    // Events formatieren für System-Nachricht
    const formattedEvents = events.map(event => ({
      date: event.date,
      title: { text: event.title, url: event.url || '' },
      location: event.location || ''
    }));

    const systemMessage = `Du bist ein hilfreicher Event-Assistent für Liebefeld.\nAktueller Tag: ${today} (YYYY-MM-DD)\nTageszeit: ${timeOfDay}\nWetter: ${weather}\n`;

    // Anfrage an Mistral mit Function Calling
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.1-24b-instruct:free',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user',   content: query }
        ],
        temperature: 0,
        max_tokens: 1024,
        functions,
        function_call: { name: 'render_event_panel' }
      })
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    const choice = data.choices[0].message;

    let output;
    if (choice.function_call) {
      // Funktion aufgerufen: JSON-Argumente parsen
      const args = JSON.parse(choice.function_call.arguments);
      output = args.events; // strukturiertes Event-Array
    } else {
      // Fallback: textuelle Antwort
      output = choice.content;
    }

    return new Response(JSON.stringify({ response: output }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI chat function:', error);
    const errorResponse = `<div class=\"bg-red-900/20 border border-red-700/30 rounded-lg p-3\">` +
      `<h5 class=\"font-medium text-sm text-red-600 dark:text-red-400\">Fehler bei der Verarbeitung:</h5>` +
      `<p class=\"text-sm mt-2\">Entschuldigung, ich konnte deine Anfrage nicht verarbeiten.</p></div>`;
    return new Response(JSON.stringify({ response: errorResponse }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
