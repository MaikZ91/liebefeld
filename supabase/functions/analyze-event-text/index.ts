
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Text analysis function called");
    
    const requestData = await req.json();
    const { text } = requestData;
    
    if (!text) {
      console.error("No text provided");
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Analyzing text:", text);

    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Call OpenAI API to analyze the text
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Assistent, der Eventinformationen aus Text extrahiert.
            Extrahiere die folgenden Felder, wenn vorhanden: title (Titel des Events), description (Beschreibung), 
            date (im Format YYYY-MM-DD), time (im Format HH:MM), location (Ort), organizer (Veranstalter), 
            und category (Kategorie).
            
            Gültige Kategorien sind: Konzert, Party, Ausstellung, Sport, Workshop, Kultur, Sonstiges.
            Verwende die am besten passende Kategorie.
            
            WICHTIG: Antworte ausschließlich im JSON-Format mit diesen Feldern. Wenn ein Feld nicht vorhanden ist, lasse es weg.
            KEIN einleitender Text oder andere Informationen - NUR das reine JSON.
            
            Bei Datumsangaben wie "14. März 2025" oder "14.03.2025", wandle diese in "2025-03-14" um.
            
            Wenn "INDIE-POSTPUNK-ELEKTRO-ALTERNATIVE" erwähnt wird, ist die Kategorie "Konzert" oder "Party".
            
            Bei Zeitangaben, wandle alle Formate in 24h-Format um (HH:MM). Beispiel: "8 PM" oder "20 Uhr" wird zu "20:00".`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
      }),
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIData);
      return new Response(
        JSON.stringify({ error: 'Error analyzing text with AI', details: openAIData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extract the AI-generated content
    const content = openAIData?.choices?.[0]?.message?.content;
    console.log("OpenAI response:", content);
    
    // Parse the JSON from the content
    let eventData = {};
    try {
      // Trim any non-JSON text that might be in the response
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart >= 0 && jsonEnd >= 0) {
        const jsonString = content.substring(jsonStart, jsonEnd + 1);
        eventData = JSON.parse(jsonString);
      } else {
        eventData = JSON.parse(content);
      }
      
      console.log("Parsed event data:", eventData);
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error, 'Response was:', content);
      
      // Attempt to extract data anyway if the response is not valid JSON
      const titleMatch = content.match(/title[":]+\s*["']?([^"',}]+)["']?/i);
      const dateMatch = content.match(/date[":]+\s*["']?([^"',}]+)["']?/i);
      const timeMatch = content.match(/time[":]+\s*["']?([^"',}]+)["']?/i);
      const locationMatch = content.match(/location[":]+\s*["']?([^"',}]+)["']?/i);
      const categoryMatch = content.match(/category[":]+\s*["']?([^"',}]+)["']?/i);
      const descriptionMatch = content.match(/description[":]+\s*["']?([^"',}]+)["']?/i);
      const organizerMatch = content.match(/organizer[":]+\s*["']?([^"',}]+)["']?/i);
      
      eventData = {
        ...(titleMatch && { title: titleMatch[1].trim() }),
        ...(dateMatch && { date: dateMatch[1].trim() }),
        ...(timeMatch && { time: timeMatch[1].trim() }),
        ...(locationMatch && { location: locationMatch[1].trim() }),
        ...(categoryMatch && { category: categoryMatch[1].trim() }),
        ...(descriptionMatch && { description: descriptionMatch[1].trim() }),
        ...(organizerMatch && { organizer: organizerMatch[1].trim() })
      };
      
      console.log("Manually extracted data:", eventData);
    }

    return new Response(
      JSON.stringify(eventData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in text analysis function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
