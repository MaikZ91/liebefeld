
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
    
    // Log date info
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    console.log(`Server current date: ${today}`);
    console.log(`Received currentDate from client: ${currentDate}`);
    console.log(`Received next week range: ${nextWeekStart} to ${nextWeekEnd}`);
    
    // Fetch all events from the database for backup/fallback
    const { data: dbEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .order('date', { ascending: true });

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    const events = allEvents && allEvents.length > 0 ? allEvents : dbEvents;
    
    console.log(`Processing ${events.length} events for AI response (${allEvents ? allEvents.length : 0} provided from frontend)`);
    
    // Log statistics
    const todayEvents = events.filter(event => event.date === today);
    console.log(`Events specifically for today (${today}): ${todayEvents.length}`);
    if (todayEvents.length > 0) {
      console.log('First few today events:', todayEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Log next week events
    const nextWeekEvents = events.filter(event => 
      event.date >= nextWeekStart && event.date <= nextWeekEnd
    );
    console.log(`Events for next week (${nextWeekStart} to ${nextWeekEnd}): ${nextWeekEvents.length}`);
    if (nextWeekEvents.length > 0) {
      console.log('First few next week events:', nextWeekEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Format events data for the AI
    const formattedEvents = events.map(event => `
      Event: ${event.title}
      Datum: ${event.date}
      Zeit: ${event.time}
      Kategorie: ${event.category}
      ${event.location ? `Ort: ${event.location}` : ''}
      ${event.description ? `Beschreibung: ${event.description}` : ''}
      ${event.id.startsWith('github-') ? 'Quelle: Externe Veranstaltung' : 'Quelle: Community Event'}
    `).join('\n\n');

    const systemMessage = `Du bist ein hilfreicher Event-Assistent für Liebefeld. 
    Aktueller Tag: ${today} (Format: YYYY-MM-DD)
    Aktuelle Tageszeit: ${timeOfDay}
    Aktuelles Wetter: ${weather}
    
    Hier sind die verfügbaren Events:
    ${formattedEvents}
    
    Beantworte Fragen zu den Events präzise und freundlich auf Deutsch. 
    Berücksichtige dabei:
    1. Wenn der Nutzer nach "heute" fragt, beziehe dich auf Events mit Datum ${today}
    2. Wenn der Nutzer nach "nächster Woche" fragt, beziehe dich auf Events vom ${nextWeekStart} (Montag) bis ${nextWeekEnd} (Sonntag)
    3. Die Woche beginnt immer am Montag und endet am Sonntag
    4. Die aktuelle Tageszeit und das Wetter
    5. Die spezifischen Interessen in der Anfrage
    6. Gib relevante Events mit allen Details an
    7. Wenn keine passenden Events gefunden wurden, mache alternative Vorschläge
    8. Berücksichtige ALLE Events, auch die aus externen Quellen (mit 'Quelle: Externe Veranstaltung' gekennzeichnet)
    9. Verwende das Datum-Format YYYY-MM-DD für Vergleiche
    
    Format deine Antworten klar und übersichtlich in HTML mit diesen Klassen:
    - Verwende bg-gray-900/20 border border-gray-700/30 für normale Event-Container
    - Verwende bg-blue-900/20 border border-blue-700/30 für externe Event-Container
    - Nutze text-red-500 für Überschriften
    - Nutze text-sm für normalen Text
    - Nutze rounded-lg p-3 mb-3 für Container-Padding
    `;

    console.log('Sending request to Open Router API with Gemini model...');
    
    // Define backup models in case the primary model fails
    const models = [
      'google/gemini-2.0-flash-exp:free',
      'anthropic/claude-3-sonnet:beta',
      'openai/gpt-4o-mini'
    ];

    let response = null;
    let modelUsed = '';
    let errorDetails = '';
    
    // Try primary model first
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/lovable-chat', 
          'X-Title': 'Lovable Chat'
        },
        body: JSON.stringify({
          model: models[0],
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });
      
      modelUsed = models[0];
      
      // Log full response for debugging
      const responseStatus = response.status;
      const responseStatusText = response.statusText;
      console.log(`OpenRouter API response status: ${responseStatus} ${responseStatusText}`);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter API error response: ${errorBody}`);
        errorDetails = `${responseStatus} ${responseStatusText} - ${errorBody}`;
        throw new Error(`OpenRouter API error: ${errorDetails}`);
      }
    } catch (primaryError) {
      console.error('Primary model error:', primaryError.message);
      
      // Try fallback models sequentially
      for (let i = 1; i < models.length; i++) {
        try {
          console.log(`Trying fallback model: ${models[i]}`);
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/lovable-chat', 
              'X-Title': 'Lovable Chat'
            },
            body: JSON.stringify({
              model: models[i],
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: query }
              ],
              temperature: 0.7,
              max_tokens: 1024
            })
          });
          
          modelUsed = models[i];
          
          if (response.ok) {
            console.log(`Successfully switched to fallback model: ${models[i]}`);
            break;
          } else {
            const errorBody = await response.text();
            console.error(`Fallback model ${models[i]} error: ${errorBody}`);
          }
        } catch (fallbackError) {
          console.error(`Fallback model ${models[i]} error:`, fallbackError.message);
        }
      }
      
      // If all models failed
      if (!response || !response.ok) {
        throw new Error(`All API models failed. Primary error: ${primaryError.message}`);
      }
    }

    // Parse and handle the response carefully
    let data = null;
    let aiResponse = '';
    let modelInfo = {};
    
    try {
      data = await response.json();
      console.log('OpenRouter API response received successfully');
      
      // Enhanced debugging for response structure
      console.log('Response structure type:', typeof data);
      if (typeof data === 'object') {
        console.log('Response has keys:', Object.keys(data));
        
        // Log the first layer of response structure
        Object.keys(data).forEach(key => {
          const value = data[key];
          console.log(`Key: ${key}, Type: ${typeof value}, Value:`, 
            typeof value === 'object' ? 'Object/Array' : 
            typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value);
        });
        
        // Specifically check for choices structure
        if (data.choices && Array.isArray(data.choices)) {
          console.log('Choices array length:', data.choices.length);
          if (data.choices.length > 0) {
            console.log('First choice keys:', Object.keys(data.choices[0]));
          }
        }
      }
      
      // Try to extract response text using different possible formats
      if (data.choices && data.choices[0] && data.choices[0].message) {
        aiResponse = data.choices[0].message.content;
        console.log('Found response in standard OpenAI format');
      } else if (data.choices && data.choices[0] && data.choices[0].text) {
        aiResponse = data.choices[0].text;
        console.log('Found response in alternative format with choices.text');
      } else if (data.content) {
        aiResponse = data.content;
        console.log('Found response in alternative format with content property');
      } else if (data.response) {
        aiResponse = data.response;
        console.log('Found response in alternative format with response property');
      } else if (data.message && data.message.content) {
        aiResponse = data.message.content;
        console.log('Found response in alternative format with message.content');
      } else if (data.generation) {
        aiResponse = data.generation;
        console.log('Found response in alternative format with generation property');
      } else if (typeof data === 'string') {
        // Direct string response
        aiResponse = data;
        console.log('Found direct string response');
      } else {
        // Last resort: try to find any string field that could be the response
        const stringFields = Object.entries(data)
          .filter(([_, value]) => typeof value === 'string' && value.length > 20)
          .map(([key, value]) => ({ key, value }));
        
        if (stringFields.length > 0) {
          // Use the longest string as probable response
          const mostLikelyResponse = stringFields.sort((a, b) => b.value.length - a.value.length)[0];
          console.log(`Using field "${mostLikelyResponse.key}" as probable response`);
          aiResponse = mostLikelyResponse.value;
        } else {
          console.error('Could not find response text in any expected format');
          console.error('Response structure:', JSON.stringify(data));
          throw new Error('Unable to parse AI response from unexpected format');
        }
      }
      
      // Create model info object
      modelInfo = {
        model: modelUsed || data.model || 'AI Model',
        promptTokens: data.usage?.prompt_tokens || 'N/A',
        completionTokens: data.usage?.completion_tokens || 'N/A',
        totalTokens: data.usage?.total_tokens || 'N/A'
      };
      
      console.log(`Model used: ${modelInfo.model}`);
      console.log(`Token usage - Prompt: ${modelInfo.promptTokens}, Completion: ${modelInfo.completionTokens}, Total: ${modelInfo.totalTokens}`);
    } catch (parsingError) {
      console.error('Error parsing API response:', parsingError);
      console.error('Raw response data:', data);
      
      // Try to parse the raw response as text
      try {
        // If we have the raw response body, try again as text
        const responseText = await response.text();
        console.log('Raw response body:', responseText && responseText.length > 200 ? 
          responseText.substring(0, 200) + '...' : responseText);
        
        if (responseText && responseText.trim()) {
          aiResponse = `<p>${responseText}</p>`;
          console.log('Using raw response text as fallback');
        } else {
          throw new Error('Raw response is empty');
        }
      } catch (textParseError) {
        console.error('Failed to parse response as text:', textParseError);
        
        // Create a basic error response
        aiResponse = `
          <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
            <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler beim Parsen der API-Antwort</h5>
            <p class="text-sm mt-2">
              Es gab ein Problem bei der Verarbeitung der Antwort vom KI-Modell. 
              Bitte probiere es mit einer anderen Frage oder später noch einmal.
            </p>
            <p class="text-xs mt-2 text-red-400">Details: ${parsingError.message}</p>
          </div>
        `;
      }
      
      modelInfo = {
        model: modelUsed || 'Unknown Model',
        error: parsingError.message
      };
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      modelInfo: modelInfo 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI chat function:', error);
    
    const errorResponse = `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
        <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der Verarbeitung:</h5>
        <p class="text-sm mt-2">
          Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. 
          Hier sind einige Möglichkeiten, wie du weitermachen kannst:
        </p>
        <ul class="list-disc list-inside mt-1 text-sm space-y-1">
          <li>Stelle deine Frage anders</li>
          <li>Frage nach Events für heute oder diese Woche</li>
          <li>Suche nach einer bestimmten Kategorie, wie "Konzerte" oder "Sport"</li>
        </ul>
        <p class="text-xs mt-2 text-red-400">Fehlerdetails: ${error.message}</p>
      </div>
    `;
    
    return new Response(JSON.stringify({ 
      response: errorResponse,
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
