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
    return new Response(nulls, { headers: corsHeaders });
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
      allEvents, // Diese Variable enthält jetzt die gesamte Liste vom Frontend
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
     * EVENT RETRIEVAL AND FILTERING (VORBEREITUNG FÜR KI-PROMPT)
     ***************************/
    // Wir erhalten 'allEvents' vom Frontend, die bereits aus der Supabase-Datenbank stammen könnten.
    // Daher ist es besser, 'allEvents' als Ausgangspunkt zu nehmen, um Duplikate oder zusätzliche
    // DB-Abfragen zu vermeiden, wenn die Events bereits vom Frontend geladen wurden.
    // Falls 'allEvents' leer ist, rufen wir sie von der Datenbank ab.
    let dbEvents = allEvents?.length ? allEvents : (await supabase.from("community_events").select("*")).data;

    if (!dbEvents) { // Fallback, falls immer noch keine Events vorhanden sind
      dbEvents = [];
    }

    let filteredEvents = [...dbEvents]; // Klonen, um das Original nicht zu modifizieren
    
    const lowercaseQuery = query.toLowerCase();
    
    const isPersonalRequest = query.toLowerCase().includes("zu mir passen") || 
                             query.toLowerCase().includes("meine interessen") || 
                             query.toLowerCase().includes("persönlich") ||
                             query.includes("❤️");

    console.log(`[ai-event-chat] Is this a personalized request? ${isPersonalRequest}`);

    const currentDateObj = new Date(currentDate);
    const currentMonth = currentDateObj.getMonth();
    const currentYear = currentDateObj.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
    
    console.log(`[ai-event-chat] Current month range: ${firstDayOfMonth} to ${lastDayOfMonth}`);

    // --- KI-Filterlogik hier in den System-Prompt einbauen, statt Events vorzufiltern ---
    // Die Vorfilterung hier wird sehr leicht gehalten, da die KI die Hauptarbeit machen soll.
    // Nur absolute Grundfilterung wie "zukünftige Events"
    
    filteredEvents = filteredEvents.filter((e: any) => e.date >= today); // Nur zukünftige Events

    // Sort all filtered events by date
    filteredEvents = filteredEvents.sort((a: any, b: any) => a.date.localeCompare(b.date));

    console.log(`[ai-event-chat] Sende ${filteredEvents.length} gefilterte Events an das KI-Modell`);
    
    // Log some debug information about events
    if (currentDate) {
      const todayEvents = filteredEvents.filter((e: any) => e.date === currentDate);
      console.log(`[ai-event-chat] Events für heute (${currentDate}) nach Filterung: ${todayEvents.length}`);
      if (todayEvents.length > 0) {
        console.log('[ai-event-chat] Erste Events für heute:', todayEvents.slice(0, 3).map((e: any) => `${e.title} (${e.date})`));
      }
    }

    // Log events in the current month
    const thisMonthEvents = filteredEvents.filter((e: any) => e.date >= firstDayOfMonth && e.date <= lastDayOfMonth);
    console.log(`[ai-event-chat] Events für diesen Monat (${firstDayOfMonth} bis ${lastDayOfMonth}): ${thisMonthEvents.length}`);
    if (thisMonthEvents.length > 0) {
      console.log('[ai-event-chat] Beispiele für Events diesen Monat:', 
        thisMonthEvents.slice(0, 3).map((e: any) => `${e.title} (${e.date})`));
    }
    
    // Format events for KI (als Markdown-Liste mit allen Details)
    const formattedEvents = filteredEvents
      .map((e: any) => {
        const actualCategory = e.category || 'Unbekannt';
        // Nutze Markdown für die Formatierung, die im Frontend in HTML umgewandelt wird
        return `* **Event: ${e.title}**\n  Datum: ${e.date} um ${e.time}\n  Kategorie: ${actualCategory}${e.location ? `\n  Ort: ${e.location}` : ""}`;
      })
      .join("\n\n");

    const totalEventsInfo = `Es gibt insgesamt ${dbEvents.length} Events in der Datenbank. Die folgenden ${filteredEvents.length} Events sind anstehend und wurden dir für die Beantwortung der Anfrage bereitgestellt:`;
    
    let systemMessage = `Du bist ein Event‑Assistent für Liebefeld. Aktuelles Datum: ${today}.
    Deine Aufgabe ist es, Events basierend auf der Nutzeranfrage zu finden und klar und prägnant zu präsentieren.
    Berücksichtige die bereitgestellten Event-Daten und filtere sie streng nach der Anfrage des Nutzers (z.B. "heute", "morgen", "Sport-Events", "Konzert").
    Gib die Antwort als eine Liste von Events aus, ohne die Liste zu kürzen oder Hinweise wie "Swipe durch die Events" hinzuzufügen.
    Formatiere die Event-Titel immer **FETT** (z.B. **Event Titel**), damit sie im Chat rot erscheinen.
    Wenn keine passenden Events gefunden werden, gib eine freundliche Nachricht aus, dass keine Events für die Anfrage gefunden wurden.
    \n${totalEventsInfo}\n`;
    
    if (isPersonalRequest || userInterests?.length > 0 || userLocations?.length > 0) {
      systemMessage += `Dies ist eine personalisierte Anfrage. `;
      
      if (userInterests && userInterests.length > 0) {
        systemMessage += `Der Nutzer interessiert sich für: ${userInterests.join(', ')}. `;
      }
      
      if (userLocations && userLocations.length > 0) {
        systemMessage += `Der Nutzer bevorzugt folgende Orte: ${userLocations.join(', ')}. `;
      }
      
      systemMessage += `Berücksichtige diese Vorlieben in deiner Antwort und empfehle passende Events. `;

      
      // If filtering has been applied based on interests
      if (isPersonalRequest && userInterests?.length > 0) {
        systemMessage += `Ich habe die Ergebnisse nach deinen Interessen gefiltert. `;
        systemMessage += `Erwähne explizit, dass du nach dem Interesse "${userInterests.join(', ')}" gefiltert hast. `;
      }
    }

    // Add specific month context (Anweisung für die KI)
    if (
      lowercaseQuery.includes("in diesem monat") ||
      lowercaseQuery.includes("diesen monat") ||
      lowercaseQuery.includes("this month") ||
      lowercaseQuery.includes("im mai") ||
      lowercaseQuery.includes("in may") ||
      lowercaseQuery.includes("aktueller monat") ||
      lowercaseQuery.includes("current month")
    ) {
      const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", 
                         "Juli", "August", "September", "Oktober", "November", "Dezember"];
      const germanMonthName = monthNames[currentMonth];
      
      systemMessage += `Der Nutzer hat nach Events in diesem Monat (${germanMonthName} ${currentYear}) gefragt. `;
      systemMessage += `Stelle sicher, dass du nur Events vom ${firstDayOfMonth} bis ${lastDayOfMonth} erwähnst. `;
      
      if (thisMonthEvents.length === 0) {
        systemMessage += `Es wurden keine Events für diesen Monat gefunden. Informiere den Nutzer, dass keine Events für ${germanMonthName} ${currentYear} verfügbar sind und schlage vor, es mit einem anderen Zeitraum zu versuchen. `;
      }
    }
    
    systemMessage += `Hier die Events:\n${formattedEvents}`;

    /***************************
     * CALL OPENROUTER
     ***************************/
    // Log that we're about to send the request
    console.log("[ai-event-chat] Sending request to Open Router API with Gemini model...");
    console.log("[ai-event-chat] Categories being sent:", filteredEvents.map((e: any) => `${e.title}: ${e.category}`));
    
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
    aiContent = aiContent.split('\n').map(line => {
      let trimmedLine = line.trim();
      
      // Handle markdown list items
      if (trimmedLine.match(/^[\*\-]\s+/)) {
        let itemContent = trimmedLine.replace(/^[\*\-]\s+/, '');
        
        // Extract event information if available
        const titleMatch = itemContent.match(/(.*?) um (.*?) (?:in|bei|im) (.*?) \(Kategorie: (.*?)\)/i);
        if (titleMatch) {
          const [_, title, time, location, category] = titleMatch;
          // Format as event card similar to EventCard component
          return `
            <li class="dark-glass-card rounded-lg p-2 mb-2 hover-scale">
              <div class="flex justify-between items-start gap-1">
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm text-white break-words">${title}</h4>
                  <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
                    <div class="flex items-center">
                      <svg class="w-3 h-3 mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>${time} Uhr</span>
                    </div>
                    <div class="flex items-center max-w-[120px] overflow-hidden">
                      <svg class="w-3 h-3 mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span class="truncate">${location}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="bg-black text-red-500 dark:bg-black dark:text-red-500 flex-shrink-0 flex items-center gap-0.5 text-xs font-medium whitespace-nowrap px-1.5 py-0.5 rounded-md">
                    <svg class="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    ${category}
                  </span>
                  <div class="flex items-center">
                    <svg class="w-3 h-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </div>
                </div>
              </div>
            </li>`;
        }
        
        return `<li class="mb-1">${itemContent}</li>`;
      }
      return trimmedLine; // For non-list lines
    }).join('\n');
    
    // Add <ul> tags around the list items if they exist
    if (aiContent.includes('<li>')) {
        aiContent = `<ul class="space-y-2 my-3">\n${aiContent}\n</ul>`;
    }
    
    // Generell Markdown-Bold in HTML-Bold umwandeln
    aiContent = aiContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-500">$1</strong>');
    aiContent = aiContent.replace(/__(.*?)__/g, '<strong class="text-red-500">$1</strong>');
    
    // Highlight personalized content
    if (isPersonalRequest || userInterests?.length > 0) {
      // Make interest keywords bold in the text
      if (userInterests && userInterests.length > 0) {
        userInterests.forEach((interest: string) => {
          const interestRegex = new RegExp(`\\b(${interest})\\b`, 'gi');
          aiContent = aiContent.replace(interestRegex, '<strong class="text-yellow-500">$1</strong>');
        });
      }
      
      // Add a personalization badge at the top
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