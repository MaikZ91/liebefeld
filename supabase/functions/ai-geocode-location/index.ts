// supabase/functions/ai-geocode-location/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Laden Sie Ihren OpenRouter API Key aus den Umgebungsvariablen von Supabase Secrets.
// Dies ist KRITISCH für die Sicherheit. Setzen Sie dies NICHT direkt im Code!
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

serve(async (req) => {
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

    if (!OPENROUTER_API_KEY) {
      // Geben Sie einen 500er-Fehler zurück, wenn der API-Schlüssel fehlt
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key is not configured in Supabase Secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const prompt = `Konvertiere den folgenden Standort in Längen- und Breitengrade. Gib die Antwort ausschließlich als JSON-Objekt mit den Feldern "lat" (Breitengrad, float) und "lng" (Längengrad, float) zurück. Wenn du den Standort nicht eindeutig identifizieren kannst, gib "lat": null und "lng": null zurück. Beachte, dass es sich um einen Standort in der Stadt "${cityContext || 'Bielefeld'}" handelt, falls dieser Kontext hilft.

Beispiel 1:
Input: "Forum Bielefeld"
Output: {"lat": 52.0163, "lng": 8.5298}

Beispiel 2:
Input: "SAMS"
Output: {"lat": 52.0205, "lng": 8.5342}

Beispiel 3:
Input: "Bunker Ulmenwall"
Output: {"lat": 52.0211, "lng": 8.5318}

Beispiel 4:
Input: "hochschulsport_bielefeld"
Output: {"lat": 52.0357, "lng": 8.5042}

Input: "${locationString}"
Output: `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Fügen Sie bei Bedarf Referer und X-Title hinzu, wenn Ihr OpenRouter-Konto dies erfordert
        // 'HTTP-Referer': 'https://your-domain.com', 
        // 'X-Title': 'Your App Name'
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-latest", // Wählen Sie ein passendes Modell
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // Niedrige Temperatur für faktenbasierte Antworten
        max_tokens: 100 // Geringe Token-Anzahl, da die Ausgabe kurz sein sollte
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API returned status ${response.status}: ${errorText}`);
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
