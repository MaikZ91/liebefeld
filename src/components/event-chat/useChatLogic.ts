// supabase/functions/ai-event-chat/index.ts
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
      // 'allEvents' wird jetzt NICHT mehr vom Frontend gesendet.
      // Die Edge Function holt die Events selbst.
      currentDate,
      nextWeekStart,
      nextWeekEnd,
      userInterests,
      userLocations,
    } = await req.json();

    console.log(`[ai-event-chat] Received query: ${query}`);
    console.log(`[ai-event-chat] Received currentDate: ${currentDate}`);
    console.log(`[ai-event-chat] Received next week range: ${nextWeekStart} to ${nextWeekEnd}`);
    
    if (userInterests) {
      console.log(`[ai-event-chat] User interests received: ${JSON.stringify(userInterests)}`);
    } else {
      console.log('[ai-event-chat] No user interests received');
    }
    
    if (userLocations) {
      console.log(`[ai-event-chat] User preferred locations received: ${JSON.stringify(userLocations)}`);
    } else {
      console.log('[ai-event-chat] No user locations received');
    }

    const today = new Date().toISOString().split("T")[0];

    /***************************
     * EVENT RETRIEVAL (KOMPLETTE LISTE AUS DB HOLEN)
     ***************************/
    const { data: dbEvents, error: eventsError } = await supabase
      .from("community_events")
      .select("*")
      .order("date", { ascending: true });

    if (eventsError) {
      throw new Error(`[ai-event-chat] Datenbank‑Fehler: ${eventsError.message}`);
    }

    // Filtern Sie nur grundlegend (z.B. zukünftige Events), die KI soll den Rest machen
    let filteredEvents = dbEvents.filter((e: any) => e.date >= today);

    // Sortieren Sie die Events nach Datum
    filteredEvents = filteredEvents.sort((a: any, b: any) => a.date.localeCompare(b.date));

    console.log(`[ai-event-chat] Sende ${filteredEvents.length} Events an das KI-Modell zum Filtern und Formatieren`);
    
    // Log some debug information about events (optional, für Debugging)
    const todayEvents = filteredEvents.filter((e: any) => e.date === currentDate);
    console.log(`[ai-event-chat] Events für heute (${currentDate}) (vor KI-Filterung): ${todayEvents.length}`);
    if (todayEvents.length > 0) {
      console.log('[ai-event-chat] Erste Events für heute (vor KI-Filterung):', todayEvents.slice(0, 3).map((e: any) => `${e.title} (${e.date})`));
    }
    
    // Format events for KI (als Markdown-Liste mit allen Details)
    // Die KI wird angewiesen, diese Daten zu nutzen und zu filtern
    const formattedEventsForAI = filteredEvents
      .map((e: any) => {
        const actualCategory = e.category || 'Unbekannt';
        // Hier geben wir detaillierte Informationen an die KI, damit sie entscheiden kann
        return `* Event-ID: ${e.id}\n  Titel: ${e.title}\n  Beschreibung: ${e.description || 'N/A'}\n  Datum: ${e.date}\n  Zeit: ${e.time}\n  Ort: ${e.location || 'N/A'}\n  Organisator: ${e.organizer || 'N/A'}\n  Kategorie: ${actualCategory}\n  Link: ${e.link || 'N/A'}`;
      })
      .join("\n---\n"); // Trenner, damit KI einzelne Events besser erkennt

    const totalEventsInfo = `Es gibt insgesamt ${dbEvents.length} Events in der Datenbank. Die folgenden ${filteredEvents.length} anstehenden Events wurden dir für die Beantwortung der Anfrage bereitgestellt. Deine Aufgabe ist es, diese Events entsprechend der Nutzeranfrage zu filtern und zu präsentieren.`;
    
    let systemMessage = `Du bist ein Event‑Assistent für Liebefeld. Aktuelles Datum: ${today}.
    Deine Aufgabe ist es, Events basierend auf der Nutzeranfrage zu finden und klar und prägnant zu präsentieren.
    Berücksichtige die bereitgestellten Event-Daten und filtere sie streng nach der Anfrage des Nutzers (z.B. "heute", "morgen", "diese Woche", "Wochenende", "Sport-Events", "Konzerte", "kostenlos", "Kultur").
    Gib die Antwort als eine Liste von Events aus, ohne die Liste zu kürzen oder Hinweise wie "Swipe durch die Events" oder "und X weitere Events" hinzuzufügen.
    Formatiere jeden Event-Titel immer **FETT** (z.B. **Jahn Platz Open Air**), damit er im Frontend rot erscheint.
    Gib für jedes Event mindestens Titel, Datum, Zeit, Ort und Kategorie an. Wenn ein Link vorhanden ist, füge ihn am Ende der Event-Beschreibung in Klammern hinzu.
    Wenn keine passenden Events gefunden werden, gib eine freundliche Nachricht aus, dass keine Events für die Anfrage gefunden wurden.
    Antworte in einem freundlichen und hilfsbereiten Ton.
    \n${totalEventsInfo}\n`;
    
    if (userInterests?.length > 0 || userLocations?.length > 0) {
      systemMessage += `Dies ist eine personalisierte Anfrage. `;
      
      if (userInterests && userInterests.length > 0) {
        systemMessage += `Der Nutzer interessiert sich für: ${userInterests.join(', ')}. `;
      }
      
      if (userLocations && userLocations.length > 0) {
        systemMessage += `Der Nutzer bevorzugt folgende Orte: ${userLocations.join(', ')}. `;
      }
      
      systemMessage += `Berücksichtige diese Vorlieben in deiner Antwort und empfehle passende Events. `;
    }

    // Spezifische Zeitfilter-Hinweise für die KI
    const lowercaseQuery = query.toLowerCase();
    if (lowercaseQuery.includes("heute") || lowercaseQuery.includes("today")) {
      systemMessage += `Der Nutzer hat nach Events für HEUTE (${currentDate}) gefragt. Filtere streng nur nach Events mit diesem Datum. `;
    } else if (lowercaseQuery.includes("morgen") || lowercaseQuery.includes("tomorrow")) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      systemMessage += `Der Nutzer hat nach Events für MORGEN (${tomorrowStr}) gefragt. Filtere streng nur nach Events mit diesem Datum. `;
    } else if (lowercaseQuery.includes("diese woche") || lowercaseQuery.includes("this week")) {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Montag
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // Sonntag
      const endDate = endOfWeek.toISOString().split('T')[0];
      systemMessage += `Der Nutzer hat nach Events für DIESE WOCHE (${startDate} bis ${endDate}) gefragt. Filtere streng nach Events in diesem Zeitraum. `;
    } else if (lowercaseQuery.includes("nächste woche") || lowercaseQuery.includes("next week")) {
      systemMessage += `Der Nutzer hat nach Events für NÄCHSTE WOCHE (${nextWeekStart} bis ${nextWeekEnd}) gefragt. Filtere streng nach Events in diesem Zeitraum. `;
    } else if (lowercaseQuery.includes("wochenende") || lowercaseQuery.includes("weekend")) {
      const todayDate = new Date(currentDate);
      const dayOfWeek = todayDate.getDay();
      const daysUntilSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
      const saturday = new Date(todayDate);
      saturday.setDate(todayDate.getDate() + daysUntilSaturday);
      const saturdayStr = saturday.toISOString().split('T')[0];
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      const sundayStr = sunday.toISOString().split('T')[0];
      systemMessage += `Der Nutzer hat nach Events für das WOCHENENDE (${saturdayStr} und ${sundayStr}) gefragt. Filtere streng nur nach Events mit diesen Daten. `;
    } else if (lowercaseQuery.includes("in diesem monat") || lowercaseQuery.includes("diesen monat") || lowercaseQuery.includes("this month")) {
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", 
                           "Juli", "August", "September", "Oktober", "November", "Dezember"];
        const germanMonthName = monthNames[currentMonth];
        systemMessage += `Der Nutzer hat nach Events in diesem Monat (${germanMonthName} ${currentYear}) gefragt. Filtere streng nach Events in diesem Zeitraum (${firstDayOfMonth} bis ${lastDayOfMonth}). `;
    }
    
    // Allgemeine Kategoriefilter-Hinweise für die KI
    const categoryKeywords = {
      konzert: "Konzert", party: "Party", festival: "Festival", ausstellung: "Ausstellung",
      sport: "Sport", workshop: "Workshop", kultur: "Kultur", theater: "Theater",
      kino: "Kino", lesung: "Lesung", kostenlos: "Kostenlos", gratis: "Kostenlos"
    };
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (lowercaseQuery.includes(keyword)) {
        systemMessage += `Der Nutzer hat nach Events der Kategorie "${category}" gefragt. Filtere streng nur nach Events dieser Kategorie. `;
        break;
      }
    }

    systemMessage += `\n\nVerfügbare Events:\n---\n${formattedEventsForAI}\n---`;

    /***************************
     * CALL OPENROUTER
     ***************************/
    console.log("[ai-event-chat] Sending request to Open Router API with Gemini model...");
    
    const payload = {
      model: "google/gemini-2.0-flash-lite-001", // gemini-2.0-flash-lite is more reliable
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: query },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    console.log("[ai-event-chat] Full payload being sent:", JSON.stringify(payload));

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
    } catch (parseError) {
      console.error("[ai-event-chat] Error parsing Open Router API response:", parseError);
      console.error("[ai-event-chat] Raw response:", rawBody);
      throw new Error(`Fehler beim Parsen der API-Antwort: ${parseError.message}`);
    }

    /***************************
     * BUILD RESPONSE FOR CHAT
     ***************************/
    const debugHtml = `
      <details class="rounded-lg border border-gray-700/30 bg-gray-900/10 p-3 mt-3 text-sm">
        <summary class="cursor-pointer font-medium text-red-500">Debug‑Info anzeigen</summary>
        <pre class="mt-2 whitespace-pre-wrap">Gesendetes Prompt:\n${JSON.stringify(payload, null, 2)}\n\n` +
      `HTTP‑Status: ${orRes.status} ${orRes.statusText}\n\n` +
      `Modell: ${parsed?.model || "Unbekannt"}\n\n` +
      `Benutzerinteressen: ${JSON.stringify(userInterests)}\n\n` +
      `Bevorzugte Orte: ${JSON.stringify(userLocations)}\n\n` +
      `Rohantwort:\n${rawBody}</pre>
      </details>`;

    if (!orRes.ok) {
      const errMsg = parsed?.error?.message || `HTTP-Fehler ${orRes.status}`;
      const html = `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der KI-Antwort</h5>
          <p class="text-sm mt-2">${errMsg}</p>
        </div>
        ${debugHtml}`;
      return new Response(JSON.stringify({ response: html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Zusätzliche Sicherheitsprüfung für die Antwortstruktur
    if (!parsed || !parsed.choices || !Array.isArray(parsed.choices) || parsed.choices.length === 0) {
      const html = `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der Verarbeitung</h5>
          <p class="text-sm mt-2">Ungültige Antwortstruktur von der OpenRouter API.</p>
        </div>
        ${debugHtml}`;
      return new Response(JSON.stringify({ response: html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sicherheit: nochmal überprüfen ob parsed.choices[0] existiert und message enthält
    const choice = parsed.choices[0];
    if (!choice || !choice.message) {
      const html = `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler beim Parsen der API-Antwort</h5>
          <p class="text-sm mt-2">Es gab ein Problem bei der Verarbeitung der Antwort vom KI-Modell.</p>
        </div>
        ${debugHtml}`;
      return new Response(JSON.stringify({ response: html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Nun ist es sicher, auf message.content zuzugreifen
    let aiContent: string = choice.message?.content ?? 
      (choice.message?.function_call ? JSON.stringify(choice.message.function_call) : "Keine Antwort erhalten");
    
    // Hier den Text transformieren: Umwandeln von Markdown-Listen in HTML-Listen
    // Ersetze Listen-Formatierungen wie "* Item" oder "- Item" in HTML <ul><li> Format
    // Dies geschieht im Frontend in ChatMessage.tsx formatContent()
    // Die KI soll nur Markdown-Text liefern, das Frontend wandelt ihn in HTML um.
    // Entferne die gesamte HTML-Formatierungslogik hier, da sie im Frontend stattfindet.

    // Generell Markdown-Bold in HTML-Bold umwandeln
    // Diese Logik sollte im Frontend bleiben, damit die KI reinen Markdown-Text liefern kann.
    // aiContent = aiContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-500">$1</strong>');
    // aiContent = aiContent.replace(/__(.*?)__/g, '<strong class="text-red-500">$1</strong>');
    
    // Highlight personalized content (Dies kann auch im Frontend geschehen, wenn es nur Text-Highlighting ist)
    // Wenn es ein Badge sein soll, muss die KI dies liefern oder wir fügen es hier hinzu.
    // Für jetzt belassen wir die Logik im Backend, damit die KI das Badge auslösen kann.
    if (isPersonalRequest || userInterests?.length > 0) {
      const interestsLabel = userInterests && userInterests.length > 0 
        ? `basierend auf deinem Interesse für ${userInterests.join(', ')}` 
        : 'basierend auf deinen Vorlieben';
        
      const personalizationBadge = `
        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-2 mb-3">
          <p class="text-sm flex items-center gap-1">
            <svg class="w-4 h-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            <span>Personalisierte Vorschläge ${interestsLabel}</span>
          </p>
        </div>
      `;
      
      aiContent = personalizationBadge + aiContent;
    }
    
    const finalHtml = `${aiContent}${debugHtml}`;

    return new Response(JSON.stringify({ response: finalHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ai-event-chat] Error in AI chat function:", error);
    const html = `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
        <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Unbekannter Fehler</h5>
        <p class="text-sm mt-2">${error instanceof Error ? error.message : String(error)}</p>
      </div>`;
    return new Response(JSON.stringify({ response: html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});