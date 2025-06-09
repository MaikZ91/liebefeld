
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, events } = await req.json()
    console.log('[ai-event-chat] Received request with message:', message)
    console.log('[ai-event-chat] Available events count:', events?.length || 0)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Helper function to get dummy image
    const getDummyImage = () => 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=300';

    // Format events for the AI with all necessary information including links
    const formattedEvents = events.map((e: any) => {
      const imageUrl = e.image_url && e.image_url !== 'keine' ? e.image_url : getDummyImage();
      return [
        `Event: ${e.title}`,
        `Datum: ${e.date}`,
        `Zeit: ${e.time || 'Zeit nicht angegeben'}`,
        `Ort: ${e.location || 'Ort nicht angegeben'}`,
        `Preis: ${e.price || 'Preis nicht angegeben'}`,
        `Kategorie: ${e.category || 'Kategorie nicht angegeben'}`,
        `Bild-URL: ${imageUrl}`,
        e.link ? `Link: ${e.link}` : "Link: keiner",
        `ID: ${e.id}`
      ].join('\n')
    }).join('\n\n')

    const systemPrompt = `Du bist ein hilfreicher Event-Assistent für Bielefeld. 

WICHTIGE ANWEISUNGEN FÜR PANEL-ANZEIGE:
- Wenn du Events empfiehlst oder zeigst, erstelle IMMER panelData mit den vollständigen Event-Informationen
- Verwende für Events ohne Bild-URL IMMER dieses Dummy-Bild: ${getDummyImage()}
- Stelle sicher, dass alle Event-Felder vollständig ausgefüllt sind (id, title, date, time, price, location, image_url, category, link)
- Das link-Feld soll den ursprünglichen Event-Link enthalten, falls vorhanden

ANTWORTFORMAT:
Antworte IMMER mit einem gültigen JSON-Objekt im folgenden Format:

\`\`\`json
{
  "panelData": {
    "events": [
      {
        "id": "string",
        "title": "string", 
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "price": "string",
        "location": "string",
        "image_url": "string (verwende Dummy-Bild falls nicht vorhanden)",
        "category": "string",
        "link": "string oder null"
      }
    ],
    "currentIndex": 0
  },
  "textResponse": "Deine Antwort als Text"
}
\`\`\`

Verfügbare Events:
${formattedEvents}`

    console.log('[ai-event-chat] Sending request to OpenAI...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ai-event-chat] OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const aiMessage = aiResponse.choices[0]?.message?.content

    if (!aiMessage) {
      throw new Error('No response from AI')
    }

    console.log('[ai-event-chat] Raw AI response:', aiMessage)

    // Try to parse the structured response
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch = aiMessage.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : aiMessage
      
      const parsedResponse = JSON.parse(jsonString)
      
      // Ensure all events in panelData have dummy images if needed
      if (parsedResponse.panelData?.events) {
        parsedResponse.panelData.events = parsedResponse.panelData.events.map((event: any) => ({
          ...event,
          image_url: event.image_url && event.image_url !== 'keine' ? event.image_url : getDummyImage()
        }));
      }
      
      console.log('[ai-event-chat] Successfully parsed structured AI response')
      
      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (parseError) {
      console.log('[ai-event-chat] Failed to parse as structured response, returning as text:', parseError)
      
      // Fallback to text response
      return new Response(JSON.stringify({
        textResponse: aiMessage,
        panelData: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('[ai-event-chat] Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      textResponse: 'Es tut mir leid, es gab einen Fehler beim Verarbeiten Ihrer Anfrage.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
