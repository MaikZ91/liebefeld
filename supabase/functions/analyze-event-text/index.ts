
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple text extraction function that works without API
function extractEventDataFromText(text: string) {
  console.log("Fallback text analysis running on:", text);
  
  // Helper function to extract date in YYYY-MM-DD format
  const extractDate = (text: string) => {
    // Match dates like "14. MÄRZ 2025" or "14.03.2025"
    const dateRegex1 = /(\d{1,2})[.,\s]+([A-ZÄÖÜa-zäöü]+)[.,\s]+(\d{4})/i;
    const dateRegex2 = /(\d{1,2})[.,\s]+(\d{1,2})[.,\s]+(\d{4})/;
    
    let match = text.match(dateRegex1);
    if (match) {
      const day = match[1].padStart(2, '0');
      let month = "01";
      
      // Convert month name to number
      const monthName = match[2].toLowerCase();
      if (monthName.includes("jan")) month = "01";
      else if (monthName.includes("feb")) month = "02";
      else if (monthName.includes("mär") || monthName.includes("mar")) month = "03";
      else if (monthName.includes("apr")) month = "04";
      else if (monthName.includes("mai")) month = "05";
      else if (monthName.includes("jun")) month = "06";
      else if (monthName.includes("jul")) month = "07";
      else if (monthName.includes("aug")) month = "08";
      else if (monthName.includes("sep")) month = "09";
      else if (monthName.includes("okt")) month = "10";
      else if (monthName.includes("nov")) month = "11";
      else if (monthName.includes("dez")) month = "12";
      
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    
    match = text.match(dateRegex2);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    
    return null;
  };
  
  // Helper function to extract time in HH:MM format
  const extractTime = (text: string) => {
    // Match times like "20:00" or "8 PM" or "20 Uhr"
    const timeRegex1 = /(\d{1,2}):(\d{2})/;
    const timeRegex2 = /(\d{1,2})(?:\s*)(AM|PM|Uhr)/i;
    
    let match = text.match(timeRegex1);
    if (match) {
      const hour = match[1].padStart(2, '0');
      const minute = match[2];
      return `${hour}:${minute}`;
    }
    
    match = text.match(timeRegex2);
    if (match) {
      let hour = parseInt(match[1]);
      const suffix = match[2].toLowerCase();
      
      // Convert to 24-hour format
      if (suffix === "pm" && hour < 12) hour += 12;
      if (suffix === "am" && hour === 12) hour = 0;
      
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    
    return null;
  };
  
  // Extract title (look for capitalized words or prominent text)
  let title = "";
  const titleMatch = text.match(/(INDIE[-\s]*POSTPUNK[-\s]*ELEKTRO[-\s]*ALTERNATIVE|ALTERNATIVE[-\s]*TANZMUSIK)/i);
  if (titleMatch) {
    title = titleMatch[0].trim();
  } else {
    // Look for any line that could be a title (all caps or prominent)
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toUpperCase() === line && line.length > 5 && line.length < 50) {
        title = line.trim();
        break;
      }
    }
  }
  
  // Default data
  let category = "Party";
  
  // If indie/postpunk/elektro keywords are found, set appropriate category
  if (text.match(/(INDIE|POSTPUNK|ELEKTRO|ALTERNATIVE)/i)) {
    if (text.match(/(TANZMUSIK|PARTY)/i)) {
      category = "Party";
    } else {
      category = "Konzert";
    }
  }
  
  // Extract location (commonly "BIELEFELD" with a venue name nearby)
  let location = "";
  const locationMatch = text.match(/(?:CUTIE|BIELEFELD|CLUB)/i);
  if (locationMatch) {
    // Try to get context around the location
    const contextStart = Math.max(0, text.indexOf(locationMatch[0]) - 15);
    const contextEnd = Math.min(text.length, text.indexOf(locationMatch[0]) + 15);
    location = text.substring(contextStart, contextEnd).trim();
  }
  
  // Extract date
  const date = extractDate(text);
  
  // Extract time
  const time = extractTime(text) || "20:00";
  
  // Extract organizer (often near @, presented by, etc.)
  let organizer = "";
  if (text.match(/(?:@|präsentiert von|presents)/i)) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.match(/(?:@|präsentiert von|presents)/i)) {
        organizer = line.trim();
        break;
      }
    }
  } else if (text.toLowerCase().includes("cutie")) {
    organizer = "Cutie Bielefeld";
  } else if (text.toLowerCase().includes("riot.club")) {
    organizer = "Riot Club";
  }
  
  // Create result object
  const result: {[key: string]: string} = {};
  if (title) result.title = title;
  if (date) result.date = date;
  if (time) result.time = time;
  if (location) result.location = location;
  if (organizer) result.organizer = organizer;
  if (category) result.category = category;
  
  // For indie/postpunk events, add a default description if none was found
  if (category === "Konzert" || category === "Party") {
    result.description = "INDIE-POSTPUNK-ELEKTRO-ALTERNATIVE Musikveranstaltung";
  }
  
  console.log("Extracted event data:", result);
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Text analysis function called");
    
    const requestData = await req.json();
    const { text } = requestData;
    
    if (!text) {
      console.error("No text provided");
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Analyzing text:", text);

    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    // If OpenAI API key is available, use it
    if (OPENAI_API_KEY) {
      try {
        console.log("Using OpenAI for text analysis");
        // Call OpenAI API to analyze the text
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Du bist ein Assistent, der Eventinformationen aus Text extrahiert.
                Extrahiere die folgenden Felder, wenn vorhanden: title (Titel des Events), description (Beschreibung), 
                date (im Format YYYY-MM-DD), time (im Format HH:MM), location (Ort), organizer (Veranstalter), 
                und category (Kategorie).
                
                Gültige Kategorien sind: Konzert, Party, Ausstellung, Sport, Workshop, Kultur, Sonstiges.
                Verwende die am besten passende Kategorie.
                
                WICHTIG: Antworte ausschließlich im JSON-Format mit diesen Feldern. Wenn ein Feld nicht vorhanden ist, lasse es weg.
                KEIN einleitender Text oder andere Informationen - NUR das reine JSON.
                
                Bei Datumsangaben wie "14. März 2025" oder "14.03.2025", wandle diese in "2025-03-14" um.
                
                Wenn "INDIE-POSTPUNK-ELEKTRO-ALTERNATIVE" erwähnt wird, ist die Kategorie "Konzert" oder "Party".
                
                Bei Zeitangaben, wandle alle Formate in 24h-Format um (HH:MM). Beispiel: "8 PM" oder "20 Uhr" wird zu "20:00".`
              },
              {
                role: 'user',
                content: text
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI API returned ${openAIResponse.status}: ${await openAIResponse.text()}`);
        }
        
        const openAIData = await openAIResponse.json();
        
        // Extract the AI-generated content
        const content = openAIData?.choices?.[0]?.message?.content;
        console.log("OpenAI response:", content);
        
        // Parse the JSON from the content
        let eventData = {};
        try {
          // Trim any non-JSON text that might be in the response
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}');
          
          if (jsonStart >= 0 && jsonEnd >= 0) {
            const jsonString = content.substring(jsonStart, jsonEnd + 1);
            eventData = JSON.parse(jsonString);
          } else {
            eventData = JSON.parse(content);
          }
          
          console.log("Parsed event data:", eventData);
          return new Response(
            JSON.stringify(eventData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error parsing AI response as JSON:', error, 'Response was:', content);
          throw error; // Let the fallback handler deal with it
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        console.log("Falling back to basic text extraction");
        // Fall back to basic extraction if OpenAI fails
      }
    }
    
    // If we don't have an API key or OpenAI failed, use our basic extraction
    console.log("Using basic text extraction fallback");
    const extractedData = extractEventDataFromText(text);
    
    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in text analysis function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
