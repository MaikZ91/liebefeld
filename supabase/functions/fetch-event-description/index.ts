import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventLink, eventData } = await req.json();
    const { title, category, location, organizer } = eventData;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let description = '';
    let source: 'scraped' | 'generated' = 'generated';

    // Try to scrape if link exists
    if (eventLink) {
      try {
        console.log('Fetching event page:', eventLink);
        const pageResponse = await fetch(eventLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EventBot/1.0)'
          }
        });
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Simple text extraction (remove HTML tags)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3000); // Limit to avoid token limits

          console.log('Extracted text length:', textContent.length);

          // Generate description from scraped content
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'Du bist ein Event-Beschreibungs-Experte. Erstelle prägnante, einladende Beschreibungen für Events.'
                },
                {
                  role: 'user',
                  content: `Erstelle aus diesem Webseiteninhalt eine prägnante, einladende Event-Beschreibung in 2-3 Sätzen (max. 150 Wörter). Fokussiere dich auf das Wesentliche und was die Teilnehmer erwartet.\n\nWebseite: ${textContent}\n\nEvent: ${title}\nKategorie: ${category}\nOrt: ${location}`
                }
              ],
              max_tokens: 300
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            description = aiData.choices?.[0]?.message?.content || '';
            source = 'scraped';
            console.log('Generated description from scraped content');
          }
        }
      } catch (scrapeError) {
        console.error('Scraping failed:', scrapeError);
        // Continue to fallback generation
      }
    }

    // Fallback: Generate from metadata if scraping failed or no link
    if (!description) {
      console.log('Generating description from metadata');
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Event-Beschreibungs-Experte. Erstelle prägnante, einladende Beschreibungen für Events basierend auf den Metadaten.'
            },
            {
              role: 'user',
              content: `Erstelle eine einladende Event-Beschreibung in 2-3 Sätzen (max. 100 Wörter) basierend auf diesen Informationen:\n\nTitel: ${title}\nKategorie: ${category}\nOrt: ${location}\nOrganisator: ${organizer || 'Unbekannt'}\n\nMache es interessant und einladend!`
            }
          ],
          max_tokens: 200
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        description = aiData.choices?.[0]?.message?.content || '';
        source = 'generated';
        console.log('Generated description from metadata');
      } else {
        // Ultimate fallback
        description = `${title} ist ein ${category}-Event in ${location}. Organisiert von ${organizer || 'dem Veranstalter'}. Sei dabei und erlebe ein tolles Event!`;
      }
    }

    return new Response(
      JSON.stringify({ description, source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        description: 'Ein spannendes Event wartet auf dich!',
        source: 'fallback'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
