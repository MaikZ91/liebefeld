import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /***************************
     * INPUT + PREPARATION
     ***************************/
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      query,
      timeOfDay,
      weather,
      allEvents,
      currentDate,
      nextWeekStart,
      nextWeekEnd,
    } = await req.json();

    const today = new Date().toISOString().split("T")[0];

    /***************************
     * EVENT RETRIEVAL
     ***************************/
    const { data: dbEvents, error: eventsError } = await supabase
      .from("community_events")
      .select("*")
      .order("date", { ascending: true });

    if (eventsError) {
      throw new Error(`Datenbank‑Fehler: ${eventsError.message}`);
    }

    const events = allEvents?.length ? allEvents : dbEvents;

    const formattedEvents = events
      .map((e) =>
        [
          `Event: ${e.title}`,
          `Datum: ${e.date}`,
          `Zeit: ${e.time}`,
          `Kategorie: ${e.category}`,
          e.location ? `Ort: ${e.location}` : "",
        ].filter(Boolean).join("\n")
      )
      .join("\n\n");

    const systemMessage =
      `Du bist ein Event‑Assistent für Liebefeld. Aktuelles Datum: ${today}.\n` +
      `Hier die Events:\n${formattedEvents}`;

    /***************************
     * CALL OPENROUTER
     ***************************/
    const payload = {
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: query },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    const orRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const rawBody = await orRes.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      /* leer */
    }

    /***************************
     * BUILD RESPONSE FOR CHAT
     ***************************/
    const debugHtml = `
      <details class="rounded-lg border border-gray-700/30 bg-gray-900/10 p-3 mt-3 text-sm">
        <summary class="cursor-pointer font-medium text-red-500">Debug‑Info anzeigen</summary>
        <pre class="mt-2 whitespace-pre-wrap">Gesendetes Prompt:\n${JSON.stringify(payload, null, 2)}\n\n` +
      `HTTP‑Status: ${orRes.status} ${orRes.statusText}\n\n` +
      `Rohantwort:\n${rawBody}</pre>
      </details>`;

    if (!orRes.ok || !parsed?.choices?.length) {
      const errMsg =
        parsed?.error?.message ??
          `Fehlerhafte Struktur oder HTTP‑Fehler ${orRes.status}`;
      const html = `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der KI‑Antwort</h5>
          <p class="text-sm mt-2">${errMsg}</p>
        </div>
        ${debugHtml}`;
      return new Response(JSON.stringify({ response: html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiContent: string = parsed.choices[0].message?.content ??
      JSON.stringify(parsed.choices[0].message?.function_call);

    const finalHtml = `${aiContent}${debugHtml}`;

    return new Response(JSON.stringify({ response: finalHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const html = `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
        <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Unbekannter Fehler</h5>
        <p class="text-sm mt-2">${error instanceof Error ? error.message : error}</p>
      </div>`;
    return new Response(JSON.stringify({ response: html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
