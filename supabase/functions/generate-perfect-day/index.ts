
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request data
    const requestData = await req.json();
    const { username, events, userProfile, date } = requestData;

    console.log(`Generating Perfect Day for user: ${username} with ${events?.length || 0} events`);

    // Get current weather (simplified for now)
    const currentWeather = 'sunny'; // In real implementation, fetch from weather API
    
    // Format events for the AI prompt
    const eventsText = events?.map(event => 
      `- ${event.title} (${event.time}) at ${event.location || 'N/A'} - ${event.category}`
    ).join('\n') || 'Keine Events für heute gefunden.';

    // Format user interests and locations
    const userInterests = userProfile?.interests?.join(', ') || 'Keine Interessen angegeben';
    const userLocations = userProfile?.favorite_locations?.join(', ') || 'Keine bevorzugten Orte angegeben';

    // Create comprehensive prompt for Gemini
    const aiPrompt = `Als Event Marketing Manager erstelle eine ausführliche Tageszusammenfassung für ${username} für den ${date}.

**Verfügbare Events heute:**
${eventsText}

**Nutzerprofil:**
- Interessen: ${userInterests}
- Bevorzugte Orte: ${userLocations}

**Wetter:** ${currentWeather === 'sunny' ? '☀️ Sonnig' : '🌧️ Regnerisch'}

Erstelle eine personalisierte Tageszusammenfassung mit folgender Struktur:

🌅 **Vormittag (9:00-12:00):**
[Empfehlungen basierend auf Events, Interessen und Wetter]

🌞 **Nachmittag (12:00-18:00):**
[Empfehlungen basierend auf Events, Interessen und Wetter]

🌙 **Abend (18:00-23:00):**
[Empfehlungen basierend auf Events, Interessen und Wetter]

Berücksichtige dabei:
- Die verfügbaren Events und deren Zeiten
- Die Nutzerinteressen (${userInterests})
- Die bevorzugten Orte (${userLocations})
- Das aktuelle Wetter
- Gebe konkrete Empfehlungen mit Zeiten
- Erwähne spezifische Events aus der Liste wenn passend
- Füge 2-3 alternative Aktivitäten pro Tageszeit hinzu falls keine passenden Events verfügbar sind

Sei enthusiastisch und persönlich in deinem Ton!`;

    console.log('Sending prompt to AI:', aiPrompt.substring(0, 200) + '...');

    // Call Gemini via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-site.com',
        'X-Title': 'Liebefeld Events App',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein enthusiastischer Event Marketing Manager für Liebefeld/Bern. Deine Aufgabe ist es, personalisierte Tageszusammenfassungen zu erstellen, die Events, Nutzerinteressen und Wetter berücksichtigen. Antworte immer auf Deutsch.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const perfectDayContent = aiResponse.choices[0]?.message?.content || 'Fehler beim Generieren der Perfect Day Nachricht.';

    console.log('AI response received, length:', perfectDayContent.length);

    // Create a comprehensive message
    const finalMessage = `🌟 **Dein Perfect Day in Liebefeld - ${date}** 🌟\n\n${perfectDayContent}\n\n💫 *Erstellt basierend auf ${events?.length || 0} verfügbaren Events und deinen persönlichen Vorlieben.*`;

    // Store the perfect day message in the AI chat context (not community chat)
    // We'll store it as a special message that can be retrieved by the AI chat
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        group_id: '00000000-0000-4000-8000-000000000001', // Special AI chat group ID
        sender: 'Perfect Day Assistant',
        text: finalMessage,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing perfect day message:', insertError)
    } else {
      console.log('Perfect day message stored successfully for AI chat')
    }

    // Also update subscription if this was a scheduled run
    if (requestData.isScheduled) {
      await supabase
        .from('perfect_day_subscriptions')
        .update({ last_sent_at: new Date().toISOString().split('T')[0] })
        .eq('username', username)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: finalMessage,
        eventsCount: events?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-perfect-day function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
