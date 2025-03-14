
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
    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
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
            content: `You are an AI assistant that extracts event information from text. 
            Extract the following fields if present: title, description, date (in YYYY-MM-DD format), 
            time (in HH:MM format), location, organizer, and category. 
            Respond in JSON format with these fields. If a field is not present, omit it.
            Valid categories are: Konzert, Party, Ausstellung, Sport, Workshop, Kultur, Sonstiges.
            Use the closest matching category if unsure.`
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
    
    // Parse the JSON from the content
    let eventData = {};
    try {
      eventData = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error, 'Response was:', content);
      eventData = {};
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
