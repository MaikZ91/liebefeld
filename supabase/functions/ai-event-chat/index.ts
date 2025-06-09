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
     * EVENT RETRIEVAL AND FILTERING
     ***************************/
    const { data: dbEvents, error: eventsError } = await supabase
      .from("community_events")
      .select("*")
      .order("date", { ascending: true });

    if (eventsError) {
      throw new Error(`[ai-event-chat] Datenbank‑Fehler: ${eventsError.message}`);
    }

    let filteredEvents = allEvents?.length ? allEvents : dbEvents;
    
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

    // Filter for date-specific queries
    // Filter für "heute" / "today" / "aktuell" etc.
    if (
      lowercaseQuery.includes("heute") ||
      lowercaseQuery.includes("today") ||
      lowercaseQuery.includes("aktuell") || 
      lowercaseQuery.includes("jetzt") ||
      lowercaseQuery.includes("this day")
    ) {
      console.log(`[ai-event-chat] Anfrage nach Events für heute (${currentDate}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date === currentDate);
      console.log(`[ai-event-chat] Nach Filterung für "heute": ${filteredEvents.length} Events übrig`);
    }
    // Filter for "this month" / "in diesem monat" / etc.
    else if (
      lowercaseQuery.includes("in diesem monat") ||
      lowercaseQuery.includes("diesen monat") ||
      lowercaseQuery.includes("this month") ||
      lowercaseQuery.includes("im mai") ||
      lowercaseQuery.includes("in may") ||
      lowercaseQuery.includes("aktueller monat") ||
      lowercaseQuery.includes("current month")
    ) {
      console.log(`[ai-event-chat] Anfrage nach Events für diesen Monat erkannt (${firstDayOfMonth} bis ${lastDayOfMonth})`);
      filteredEvents = filteredEvents.filter(e => e.date >= firstDayOfMonth && e.date <= lastDayOfMonth);
      console.log(`[ai-event-chat] Nach Filterung für "diesen Monat": ${filteredEvents.length} Events übrig`);
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
      
      console.log(`[ai-event-chat] Anfrage nach Events für morgen (${tomorrowStr}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date === tomorrowStr);
      console.log(`[ai-event-chat] Nach Filterung für "morgen": ${filteredEvents.length} Events übrig`);
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
      
      console.log(`[ai-event-chat] Anfrage nach Events dieser Woche (${startDate} bis ${endDate}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date >= startDate && e.date <= endDate);
      console.log(`[ai-event-chat] Nach Filterung für "diese Woche": ${filteredEvents.length} Events übrig`);
    }
    // Filter für "nächste Woche" / "next week"
    else if (
      lowercaseQuery.includes("nächste woche") ||
      lowercaseQuery.includes("next week") ||
      lowercaseQuery.includes("kommende woche")
    ) {
      console.log(`[ai-event-chat] Anfrage nach Events für nächste Woche (${nextWeekStart} bis ${nextWeekEnd}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date >= nextWeekStart && e.date <= nextWeekEnd);
      console.log(`[ai-event-chat] Nach Filterung für "nächste Woche": ${filteredEvents.length} Events übrig`);
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
      
      console.log(`[ai-event-chat] Anfrage nach Events fürs Wochenende (${saturdayStr} und ${sundayStr}) erkannt`);
      filteredEvents = filteredEvents.filter(e => e.date === saturdayStr || e.date === sundayStr);
      console.log(`[ai-event-chat] Nach Filterung für "Wochenende": ${filteredEvents.length} Events übrig`);
    }
    
    // Apply additional filters for personalized requests or heart mode
    // First apply location filtering if userLocations are provided
    if (userLocations && userLocations.length > 0) {
      console.log("[ai-event-chat] Applying location filtering with user locations:", JSON.stringify(userLocations));
      
      // Convert locations to lowercase for case-insensitive matching
      const lowerLocations = userLocations.map((location: string) => location.toLowerCase());
      
      // Count events before filtering
      const beforeLocationFilter = filteredEvents.length;
      
      // Find events at user's preferred locations
      const locationFilteredEvents = filteredEvents.filter((event: any) => 
        event.location && lowerLocations.some((loc: string) => 
          event.location.toLowerCase().includes(loc)
        )
      );
      
      // If we found events matching locations, use them, otherwise keep current filter
      if (locationFilteredEvents.length > 0) {
        filteredEvents = locationFilteredEvents;
        console.log(`[ai-event-chat] Found ${locationFilteredEvents.length} events matching user locations (from ${beforeLocationFilter})`);
      } else {
        console.log(`[ai-event-event-chat] No events found matching user locations from ${beforeLocationFilter} events`);
      }
    }
    
    // Additional filtering logic for personalized requests or interests
    if ((isPersonalRequest || query.includes("❤️")) && userInterests && userInterests.length > 0) {
      console.log("[ai-event-chat] Applying personalized interest filtering");
      
      // Convert interests to lowercase for case-insensitive matching
      const lowerInterests = userInterests.map((interest: string) => interest.toLowerCase());
      console.log("[ai-event-chat] Lowercase interests for filtering:", JSON.stringify(lowerInterests));
      
      // Count events before filtering
      const beforeInterestFilter = filteredEvents.length;
      
      // Filter events that match user interests
      const interestFilteredEvents = filteredEvents.filter((event: any) => {
        // Check category first
        if (event.category && lowerInterests.some((interest: string) => 
          event.category.toLowerCase().includes(interest.toLowerCase())
        )) {
          console.log(`[ai-event-chat] Event ${event.title} matches interest by category ${event.category}`);
          return true;
        }
        
        // Check title and description for interest keywords
        const lowerTitle = (event.title || "").toLowerCase();
        const lowerDescription = (event.description || "").toLowerCase();
        
        for (const interest of lowerInterests) {
          if (lowerTitle.includes(interest) || lowerDescription.includes(interest)) {
            console.log(`[ai-event-chat] Event ${event.title} matches interest "${interest}" in title/description`);
            return true;
          }
        }
        
        return false;
      });
      
      // If we found events matching interests, use them, otherwise keep original filter
      if (interestFilteredEvents.length > 0) {
        filteredEvents = interestFilteredEvents;
        console.log(`[ai-event-chat] Found ${interestFilteredEvents.length} events matching user interests (from ${beforeInterestFilter})`);
      } else {
        console.log(`[ai-event-chat] No events found matching user interests from ${beforeInterestFilter} events`);
      }
    }

    // Filter for categories - use actual category values instead of 'Sonstiges'
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
      wandern: "Wandern",
      hiking: "Wandern", 
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
      console.log(`[ai-event-chat] Anfrage nach Events der Kategorie "${categoryFilter}" erkannt`);
      const beforeCount = filteredEvents.length;
      filteredEvents = filteredEvents.filter((e: any) => 
        e.category && e.category.toLowerCase() === categoryFilter!.toLowerCase()
      );
      console.log(`[ai-event-chat] Nach Filterung für Kategorie "${categoryFilter}": ${filteredEvents.length} von ${beforeCount} Events übrig`);
    }

    // Make sure we're only showing future events (or today's events)
    filteredEvents = filteredEvents.filter((e: any) => e.date >= today);
    console.log(`[ai-event-chat] Nach Filterung für zukünftige Events: ${filteredEvents.length} Events übrig`);
    
    // Falls die Filterung zu streng war und keine Events übrig sind, nehmen wir die letzten 20 Events
    if (filteredEvents.length === 0) {
      console.log("Keine Events nach Filterung übrig, verwende die nächsten 20 anstehenden Events");
      filteredEvents = dbEvents
        .filter((e: any) => e.date >= today)
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .slice(0, 20);
    }

    // Sort all filtered events by date and limit to top 5 for panel
    filteredEvents = filteredEvents.sort((a: any, b: any) => a.date.localeCompare(b.date));
    const topEventsForPanel = filteredEvents.slice(0, 5);

    console.log(`[ai-event-chat] Sende ${filteredEvents.length} gefilterte Events an das KI-Modell`);
    console.log(`[ai-event-chat] Top ${topEventsForPanel.length} Events für Panel ausgewählt`);
    
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
    
    // Format events for AI processing
    const formattedEvents = filteredEvents
      .map((e: any) => {
        const actualCategory = e.category || 'Unbekannt';
        console.log(`[ai-event-chat] Event "${e.title}" has category: ${actualCategory}`);
        
        return [
          `Event: ${e.title}`,
          `Datum: ${e.date}`,
          `Zeit: ${e.time}`,
          `Kategorie: ${actualCategory}`,
          e.location ? `Ort: ${e.location}` : "",
        ].filter(Boolean).join("\n");
      })
      .join("\n\n");

    const totalEventsInfo = `Es gibt insgesamt ${dbEvents.length} Events in der Datenbank. Ich habe dir die ${filteredEvents.length} relevantesten basierend auf deiner Anfrage ausgewählt.`;
    
    let systemMessage = `Du bist ein Event‑Assistent für Liebefeld. Aktuelles Datum: ${today}.\n${totalEventsInfo}\n`;
    
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

    // Add specific month context
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
    
    systemMessage += `

WICHTIG: Du musst sowohl strukturierte Daten als auch einen Fließtext liefern. 
Antworte im folgenden JSON-Format:

{
  "panelData": {
    "events": [
      {
        "id": "event-id",
        "title": "Event Titel",
        "date": "YYYY-MM-DD",
        "time": "HH:mm",
        "price": "Preis oder 'Kostenlos'",
        "location": "Ort",
        "image_url": "https://images.unsplash.com/...",
        "category": "Kategorie"
      }
    ],
    "currentIndex": 0
  },
  "textResponse": "Hier deine normale Antwort als reiner Fließtext ohne HTML-Formatierung..."
}

WICHTIG FÜR textResponse: 
- Verwende KEINESFALLS HTML-Tags wie <h2>, <p>, <ul>, <li>, <br>, <strong>, etc.
- Schreibe nur reinen Text ohne jegliche HTML-Formatierung
- Verwende natürliche Absätze und Zeilenumbrüche für die Struktur
- STELLE DIE EVENTS ALS TIMELINE UND LISTE DAR: Sortiere Events chronologisch und präsentiere sie sowohl als zeitlichen Ablauf als auch als übersichtliche Liste
- Verwende Zeitangaben wie "Um 10:00 Uhr", "Danach um 15:00 Uhr", "Am Abend um 20:00 Uhr" etc.
- Gruppiere Events nach Tagen und Uhrzeiten für eine übersichtliche Timeline-Darstellung
- Erstelle auch eine strukturierte Liste mit Event-Namen, Zeiten und Orten
- Beispiel: "Timeline für heute in Liebefeld: Um 10:00 Uhr startet das Konzert, um 15:00 Uhr folgt der Workshop..."

Für panelData: Wähle die TOP 3-5 Events aus den gefilterten Events aus. Verwende passende Unsplash-Bilder für jedes Event basierend auf der Kategorie.

Hier die Events:\n${formattedEvents}`;

    /***************************
     * CALL OPENROUTER
     ***************************/
    // Log that we're about to send the request
    console.log("[ai-event-chat] Sending request to Open Router API with Gemini model...");
    console.log("[ai-event-chat] Categories being sent:", filteredEvents.map((e: any) => `${e.title}: ${e.category}`));
    
    const payload = {
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: query },
      ],
      temperature: 0.7,
      max_tokens: 2048,
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
    if (!orRes.ok) {
      const errMsg = parsed?.error?.message || `HTTP-Fehler ${orRes.status}`;
      const html = `
        <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Fehler bei der KI-Antwort</h5>
          <p class="text-sm mt-2">${errMsg}</p>
        </div>`;
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
        </div>`;
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
        </div>`;
      return new Response(JSON.stringify({ response: html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Nun ist es sicher, auf message.content zuzugreifen
    let aiContent: string = choice.message?.content ?? 
      (choice.message?.function_call ? JSON.stringify(choice.message.function_call) : "Keine Antwort erhalten");
    
    console.log("[ai-event-chat] Raw AI response:", aiContent);
    
    // Try to parse JSON response from AI
    let combinedResponse;
    try {
      // Remove any markdown code block formatting
      const cleanContent = aiContent.replace(/```json\n?|```\n?/g, '').trim();
      const parsedAiResponse = JSON.parse(cleanContent);
      
      if (parsedAiResponse.panelData && parsedAiResponse.textResponse) {
        console.log("[ai-event-chat] Successfully parsed structured AI response");
        combinedResponse = {
          panelData: parsedAiResponse.panelData,
          textResponse: parsedAiResponse.textResponse
        };
      } else {
        throw new Error("Missing panelData or textResponse in AI response");
      }
    } catch (jsonError) {
      console.log("[ai-event-chat] Failed to parse JSON from AI, creating fallback response");
      
      // Create fallback response with top events from our filtering
      const fallbackPanelData = {
        events: topEventsForPanel.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time,
          price: e.price || 'Kostenlos',
          location: e.location || 'Ort nicht angegeben',
          image_url: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop`,
          category: e.category || 'Event'
        })),
        currentIndex: 0
      };
      
      // Use plain text for fallback response
      let processedTextResponse = aiContent;
      
      // Remove any HTML tags that might still be present
      processedTextResponse = processedTextResponse.replace(/<[^>]*>/g, '');
      
      combinedResponse = {
        panelData: fallbackPanelData,
        textResponse: processedTextResponse
      };
    }

    return new Response(JSON.stringify(combinedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ai-event-chat] Error in AI chat function:", error);
    const html = `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
        <h5 class="font-medium text-sm text-red-600 dark:text-red-400">Unbekannter Fehler</h5>
        <p class="text-sm mt-2">${error instanceof Error ? error.message : String(error)}</p>
      </div>`;
    return new Response(JSON.stringify({ textResponse: html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
