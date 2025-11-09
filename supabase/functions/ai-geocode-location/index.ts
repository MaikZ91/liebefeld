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
        model: "google/gemini-2.0-flash-exp",
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
      throw new Error('AI did not return content in expected format.');
    }

    try {
      // Versuchen, die Antwort als JSON zu parsen
      const parsedCoordinates = JSON.parse(aiContent);

      // Stellen Sie sicher, dass die geparsten Daten lat und lng enthalten
      if (typeof parsedCoordinates.lat === 'number' && typeof parsedCoordinates.lng === 'number') {
        return new Response(
          JSON.stringify(parsedCoordinates),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Wenn lat oder lng nicht korrekt sind, behandeln als nicht gefunden
        console.warn('AI returned invalid coordinates:', parsedCoordinates);
        return new Response(
          JSON.stringify({ lat: null, lng: null, error: 'AI returned invalid coordinates' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiContent, parseError);
      throw new Error('AI response was not valid JSON or unexpected format.');
    }

  } catch (error: any) {
    console.error('Error in AI geocode function:', error);
    // Rückgabe von null-Koordinaten bei Fehlern, damit die Anwendung nicht abstürzt
    return new Response(
      JSON.stringify({ lat: null, lng: null, error: error.message || 'Unknown AI geocoding error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
