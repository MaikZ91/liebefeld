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
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Du bist ein intelligenter Activity-Detektor für Community-Posts.
Analysiere den Text und erkenne ob es ein Aktivitäts-Vorschlag ist.

Kategorien:
- Sport: laufen, joggen, radfahren, schwimmen, yoga, training, fitness, wandern, klettern
- Ausgehen: party, feiern, bar, club, trinken, ausgehen, treffen, essen, café, kino
- Kreativität: malen, workshop, kunst, basteln, kreativ, musik, theater, konzert

Erkenne auch:
- Zeitangaben: heute, morgen, übermorgen, [Uhrzeit], nachher, später
- Orte: Park, Straße, Platz, Location-Namen
- Aktivitätsverben

Antworte NUR mit JSON im folgenden Format (keine zusätzlichen Texte):
{
  "isActivityProposal": boolean,
  "category": "Sport" | "Ausgehen" | "Kreativität" | null,
  "location": string | null,
  "time": string | null,
  "date": string (YYYY-MM-DD, basierend auf Zeitangaben, Standard: heute),
  "suggestedTitle": string | null
}`;

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
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ isActivityProposal: false, category: null, location: null, time: null, date: null, suggestedTitle: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ isActivityProposal: false, category: null, location: null, time: null, date: null, suggestedTitle: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-activity-proposal:', error);
    return new Response(
      JSON.stringify({ 
        isActivityProposal: false, 
        category: null, 
        location: null, 
        time: null, 
        date: null, 
        suggestedTitle: null,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
