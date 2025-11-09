// supabase/functions/ai-geocode-location/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locationString, cityContext } = await req.json();

    if (!locationString) {
      return new Response(
        JSON.stringify({ error: 'Location string is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Lovable API key is not configured in Supabase Secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const prompt = `Konvertiere den folgenden Standort in Längen- und Breitengrade. Gib die Antwort ausschließlich als JSON-Objekt mit den Feldern "lat" (Breitengrad, float) und "lng" (Längengrad, float) zurück. Wenn du den Standort nicht eindeutig identifizieren kannst, gib "lat": null und "lng": null zurück. 

WICHTIG: Beachte den Stadt-Kontext: "${cityContext}". Suche den Standort in dieser spezifischen Stadt.

Beispiel 1 (Bielefeld):
Input: "Forum Bielefeld", Stadt: "Bielefeld"
Output: {"lat": 52.0163, "lng": 8.5298}

Beispiel 2 (Hamburg):
Input: "Reeperbahn", Stadt: "Hamburg"
Output: {"lat": 53.5496, "lng": 9.9595}

Beispiel 3 (Berlin):
Input: "Brandenburger Tor", Stadt: "Berlin"
Output: {"lat": 52.5163, "lng": 13.3777}

Input: "${locationString}"
Stadt: "${cityContext}"
Output: `;

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
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      throw new Error(`Lovable AI Gateway returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error('AI did not return content in expected format. Full data:', data);
      return new Response(
        JSON.stringify({ lat: null, lng: null, error: 'AI did not return content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Remove markdown code fencing if present (```json ... ```)
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // If wrapped text contains JSON after labels like "Output:", extract the first {...}
      if (!cleanContent.trim().startsWith('{')) {
        const start = cleanContent.indexOf('{');
        const end = cleanContent.lastIndexOf('}');
        if (start !== -1 && end > start) {
          cleanContent = cleanContent.slice(start, end + 1);
        }
      }
      
      let parsedCoordinates: any;
      try {
        parsedCoordinates = JSON.parse(cleanContent.trim());
      } catch {
        // Fallback: extract lat/lng via regex
        const match = cleanContent.match(/"lat"\s*:\s*(-?\d+(?:\.\d+)?|null)[\s\S]*?"lng"\s*:\s*(-?\d+(?:\.\d+)?|null)/i);
        if (match) {
          const latVal = match[1] === 'null' ? null : parseFloat(match[1]);
          const lngVal = match[2] === 'null' ? null : parseFloat(match[2]);
          parsedCoordinates = { lat: latVal, lng: lngVal };
        } else {
          throw new Error('Could not extract lat/lng from AI response');
        }
      }

      // Normalize potential string numbers
      const lat = typeof parsedCoordinates.lat === 'string' ? parseFloat(parsedCoordinates.lat) : parsedCoordinates.lat;
      const lng = typeof parsedCoordinates.lng === 'string' ? parseFloat(parsedCoordinates.lng) : parsedCoordinates.lng;

      const inRange = (v: number | null, min: number, max: number) => typeof v === 'number' && isFinite(v) && v >= min && v <= max;

      if (inRange(lat, -90, 90) && inRange(lng, -180, 180)) {
        const result = { lat, lng };
        console.log('Successfully geocoded:', locationString, '->', result);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.warn('AI returned invalid coordinates:', parsedCoordinates);
        return new Response(
          JSON.stringify({ lat: null, lng: null, error: 'AI returned invalid coordinates' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiContent, parseError);
      // Return a graceful 200 with nulls to avoid hard failures on client
      return new Response(
        JSON.stringify({ lat: null, lng: null, error: 'AI response was not valid JSON or unexpected format.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in AI geocode function:', error);
    // Return null coordinates with 200 to keep client resilient
    return new Response(
      JSON.stringify({ lat: null, lng: null, error: error.message || 'Unknown AI geocoding error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
