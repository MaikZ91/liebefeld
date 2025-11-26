import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, events, generateSummary, enhancePost } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = message;

    if (generateSummary) {
      systemPrompt = 'Du bist ein Event-Experte. Erstelle eine 2-Satz Zusammenfassung auf Deutsch, die die Vibe und das Genre des Events beschreibt. Sei cool und informativ.';
    } else if (enhancePost) {
      systemPrompt = 'Du bist ein Social Media Experte. Optimiere den Post-Text für maximale Engagement, mache ihn cooler und füge passende Hashtags hinzu. Antworte nur mit dem optimierten Text und Hashtags.';
    } else {
      // AI Chat Response
      const eventContext = events?.length > 0 
        ? `\n\nVerfügbare Events:\n${events.map((e: any) => 
            `- ${e.title} (${e.category}) am ${e.date} um ${e.time || 'TBA'} in ${e.location || e.city}`
          ).join('\n')}`
        : '';
      
      systemPrompt = `Du bist ein hilfsbereiter Event-Scout für THE TRIBE. Beantworte Fragen über Events in cooler, urbaner Sprache auf Deutsch. Wenn du Events empfiehlst, nenne konkrete Titel und Details.${eventContext}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.';

    if (enhancePost) {
      const hashtagMatch = reply.match(/#\w+/g) || [];
      const optimizedText = reply.replace(/#\w+/g, '').trim();
      return new Response(
        JSON.stringify({ optimizedText, hashtags: hashtagMatch }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract related events from AI response if event titles are mentioned
    const relatedEvents = events?.filter((e: any) => 
      reply.toLowerCase().includes(e.title.toLowerCase())
    ) || [];

    return new Response(
      JSON.stringify({ reply, relatedEvents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('tribe-ai-chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
