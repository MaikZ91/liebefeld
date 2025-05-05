
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

    console.log(`Server current date: ${currentDate}`);
    console.log(`Received currentDate from client: ${currentDate}`);
    console.log(`Received next week range: ${nextWeekStart} to ${nextWeekEnd}`);

    const today = new Date().toISOString().split("T")[0];

    /***************************
     * EVENT RETRIEVAL AND FILTERING
     ***************************/
    // Fetche immer alle Events aus der Datenbank, damit wir darauf filtern können
    const { data: dbEvents, error: eventsError } = await supabase
      .from("community_events")
      .select("*")
      .order("date", { ascending: true });

    if (eventsError) {
      throw new Error(`Datenbank‑Fehler: ${eventsError.message}`);
    }

    // Verwende ein Array für die gefilterten Events, die wir an das KI-Modell senden werden
    let filteredEvents = allEvents?.length ? allEvents : dbEvents;
    
    // Analyse der Benutzeranfrage für die Filterung
    const lowercaseQuery = query.toLowerCase();
    
    // Filter für "heute" / "today" / "aktuell" etc.
    if (
      lowercaseQuery.includes("heute") ||
      lowercaseQuery.includes("today") ||
      lowercaseQuery.includes("aktuell") || 
      lowercaseQuery.includes("jetzt") ||
      lowercaseQuery.includes("this day")
    ) {
      console.log(`Anfrage nach Events für heute (${currentDate}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date === currentDate);
      console.log(`Nach Filterung für "heute": ${filteredEvents.length} Events übrig`);
    }
    // Filter für "morgen" / "tomorrow"
    else if (
      lowercaseQuery.includes("morgen") ||
      lowercaseQuery.includes("tomorrow") ||
      lowercaseQuery.includes("nächster tag") ||
      lowercaseQuery.includes("next day")
    ) {
      // Berechne das Datum für morgen
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      console.log(`Anfrage nach Events für morgen (${tomorrowStr}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date === tomorrowStr);
      console.log(`Nach Filterung für "morgen": ${filteredEvents.length} Events übrig`);
    }
    // Filter für "diese Woche" / "this week"
    else if (
      lowercaseQuery.includes("diese woche") ||
      lowercaseQuery.includes("this week") ||
      lowercaseQuery.includes("aktuelle woche") ||
      lowercaseQuery.includes("current week")
    ) {
      const startOfWeek = new Date(currentDate);
      // Setze auf Montag zurück
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      const startDate = startOfWeek.toISOString().split('T')[0];
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // Sonntag
      const endDate = endOfWeek.toISOString().split('T')[0];
      
      console.log(`Anfrage nach Events dieser Woche (${startDate} bis ${endDate}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date >= startDate && e.date <= endDate);
      console.log(`Nach Filterung für "diese Woche": ${filteredEvents.length} Events übrig`);
    }
    // Filter für "nächste Woche" / "next week"
    else if (
      lowercaseQuery.includes("nächste woche") ||
      lowercaseQuery.includes("next week") ||
      lowercaseQuery.includes("kommende woche")
    ) {
      console.log(`Anfrage nach Events für nächste Woche (${nextWeekStart} bis ${nextWeekEnd}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date >= nextWeekStart && e.date <= nextWeekEnd);
      console.log(`Nach Filterung für "nächste Woche": ${filteredEvents.length} Events übrig`);
    }
    // Filter für "wochenende" / "weekend"
    else if (
      lowercaseQuery.includes("wochenende") ||
      lowercaseQuery.includes("weekend") ||
      lowercaseQuery.includes("samstag") ||
      lowercaseQuery.includes("sonntag") ||
      lowercaseQuery.includes("saturday") ||
      lowercaseQuery.includes("sunday")
    ) {
      const today = new Date(currentDate);
      const dayOfWeek = today.getDay();
      
      const daysUntilSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSaturday);
      const saturdayStr = saturday.toISOString().split('T')[0];
      
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      const sundayStr = sunday.toISOString().split('T')[0];
      
      console.log(`Anfrage nach Events fürs Wochenende (${saturdayStr} und ${sundayStr}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date === saturdayStr || e.date === sundayStr);
      console.log(`Nach Filterung für "Wochenende": ${filteredEvents.length} Events übrig`);
    }
    // Filter für Kategorien
    const categoryMapping = {
      konzert: "Konzert",
      concert: "Konzert",
      musik: "Konzert",
      music: "Konzert",
      party: "Party",
      feier: "Party",
      festival: "Festival",
      ausstellung: "Ausstellung",
      exhibition: "Ausstellung",
      kunst: "Ausstellung",
      art: "Ausstellung",
      sport: "Sport",
      sports: "Sport",
      workshop: "Workshop",
      kultur: "Kultur",
      culture: "Kultur",
      theater: "Theater",
      kino: "Kino",
      cinema: "Kino",
      film: "Kino",
      lesung: "Lesung",
      reading: "Lesung",
      literatur: "Lesung",
      literature: "Lesung"
    };
    
    let categoryFilter = null;
    for (const [keyword, category] of Object.entries(categoryMapping)) {
      if (lowercaseQuery.includes(keyword)) {
        categoryFilter = category;
        break;
      }
    }
    
    if (categoryFilter) {
      console.log(`Anfrage nach Events der Kategorie "${categoryFilter}" erkannt`);
      const beforeCount = filteredEvents.length;
      filteredEvents = filteredEvents.filter(e => 
        e.category && e.category.toLowerCase() === categoryFilter.toLowerCase()
      );
      console.log(`Nach Filterung für Kategorie "${categoryFilter}": ${filteredEvents.length} von ${beforeCount} Events übrig`);
    }
    
    // Falls die Filterung zu streng war und keine Events übrig sind, nehmen wir die letzten 20 Events
    if (filteredEvents.length === 0) {
      console.log("Keine Events nach Filterung übrig, verwende die nächsten 20 anstehenden Events");
      filteredEvents = dbEvents
        .filter(e => e.date >= currentDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 20);
    }

    console.log(`Sende ${filteredEvents.length} gefilterte Events an das KI-Modell`);
    
    // Log some debug information about events
    if (currentDate) {
      const todayEvents = filteredEvents.filter(e => e.date === currentDate);
      console.log(`Events für heute (${currentDate}) nach Filterung: ${todayEvents.length}`);
      if (todayEvents.length > 0) {
        console.log('Erste Events für heute:', todayEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
      }
    }
    
    const formattedEvents = filteredEvents
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

    // Informationen über die Gesamtanzahl der Events hinzufügen
    const totalEventsInfo = `Es gibt insgesamt ${dbEvents.length} Events in der Datenbank. Ich habe dir die ${filteredEvents.length} relevantesten basierend auf deiner Anfrage ausgewählt.`;
    
    const systemMessage =
      `Du bist ein Event‑Assistent für Liebefeld. Aktuelles Datum: ${today}.\n` +
      `${totalEventsInfo}\n` +
      `Hier die Events:\n${formattedEvents}`;

    /***************************
     * CALL OPENROUTER
     ***************************/
    // Log that we're about to send the request
    console.log("Sending request to Open Router API with Gemini model...");
    
    const payload = {
      model: "google/gemini-2.0-flash-lite-001", // gemini-2.0-flash-lite is more reliable
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
    } catch (parseError) {
      console.error("Error parsing Open Router API response:", parseError);
      console.error("Raw response:", rawBody);
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
          <p class="text-xs mt-1 text-gray-400">Powered by ${parsed?.model || "Gemini 2.0"}</p>
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
    aiContent = aiContent.replace(/\n[\*\-]\s+(.*?)(?=\n[\*\-]|\n\n|$)/g, (match, item) => {
      // Extract event information if available
      const titleMatch = item.match(/(.*?) um (.*?) (?:in|bei|im) (.*?) \(Kategorie: (.*?)\)/i);
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
      
      // Default list item if not an event
      return `<li class="mb-1">${item}</li>`;
    });
    
    // Füge <ul> Tags um die Liste
    if (aiContent.includes('<li>')) {
      aiContent = aiContent.replace(/<li>/, '<ul class="space-y-2 my-3"><li>');
      aiContent = aiContent.replace(/([^>])$/, '$1</ul>');
      
      // Stelle sicher, dass die Liste korrekt schließt
      if (!aiContent.endsWith('</ul>')) {
        aiContent += '</ul>';
      }
    }
    
    // Generell Markdown-Bold in HTML-Bold umwandeln
    aiContent = aiContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-500">$1</strong>');
    aiContent = aiContent.replace(/__(.*?)__/g, '<strong class="text-red-500">$1</strong>');
    
    // Füge eine Hinweis zum verwendeten Modell und zur Anzahl der gefilterten Events hinzu
    const modelInfo = parsed?.model ? `<p class="text-xs text-gray-400 mt-2">Powered by ${parsed.model} • ${filteredEvents.length} relevante Events aus ${dbEvents.length} analysiert</p>` : '';
    const finalHtml = `${aiContent}${modelInfo}${debugHtml}`;

    return new Response(JSON.stringify({ response: finalHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI chat function:", error);
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

