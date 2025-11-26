import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations, cityContext } = await req.json();
    
    if (!locations || locations.length === 0) {
      return new Response(JSON.stringify({ coordinates: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Batch geocoding ${locations.length} locations for ${cityContext}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }
    
    const prompt = `Geocodiere diese Standorte für "${cityContext}", Deutschland. 
Gib NUR ein valides JSON-Array zurück, keine zusätzlichen Erklärungen oder Markdown.

Standorte:
${locations.map((loc: string, i: number) => `${i + 1}. ${loc}`).join('\n')}

Antworte im folgenden exakten JSON-Format:
[{"location": "Standortname", "lat": 52.xxx, "lng": 8.xxx}, ...]

Wichtig: 
- Bei unbekannten Orten: lat und lng auf null setzen
- Nutze präzise Koordinaten für bekannte Locations
- Keine Erklärungen, nur das JSON-Array`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", coordinates: [] }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", coordinates: [] }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response:", content);
    
    // Parse JSON Array aus Response (entferne mögliche Markdown-Formatierung)
    const cleanedContent = content.replace(/```json?|```/g, '').trim();
    const coordinates = JSON.parse(cleanedContent);
    
    console.log(`Successfully geocoded ${coordinates.length} locations`);
    
    return new Response(JSON.stringify({ coordinates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Batch geocoding error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      coordinates: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
