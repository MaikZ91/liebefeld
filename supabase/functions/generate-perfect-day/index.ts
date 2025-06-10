
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    console.log('[generate-perfect-day] Starting perfect day generation...')

    // Get current date and weather (simplified for now)
    const today = new Date().toISOString().split('T')[0];
    const currentWeather = 'sunny'; // In real implementation, fetch from weather API
    
    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('perfect_day_subscriptions')
      .select('*')
      .eq('is_active', true)
      .or(`last_sent_at.is.null,last_sent_at.lt.${today}`)

    if (subError) {
      console.error('[generate-perfect-day] Error fetching subscriptions:', subError)
      throw subError
    }

    console.log(`[generate-perfect-day] Found ${subscriptions?.length || 0} active subscriptions`)

    // Get today's events
    const { data: todaysEvents, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .eq('date', today)
      .order('time', { ascending: true })

    if (eventsError) {
      console.error('[generate-perfect-day] Error fetching events:', eventsError)
      // Continue without events rather than failing completely
    }

    console.log(`[generate-perfect-day] Found ${todaysEvents?.length || 0} events for today`)

    // Process each subscription
    for (const subscription of subscriptions || []) {
      try {
        console.log(`[generate-perfect-day] Processing subscription for ${subscription.username}`)

        // Get user profile for personalization
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', subscription.username)
          .single()

        // Generate AI-powered perfect day message
        const aiMessage = await generatePerfectDayMessage(
          todaysEvents || [],
          profile,
          currentWeather,
          today
        );

        console.log(`[generate-perfect-day] Generated AI message for ${subscription.username}`)

        // Insert the personalized message into chat_messages
        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            group_id: 'general', // AI messages go to general group
            sender: 'Perfect Day Bot',
            text: aiMessage,
            avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
            created_at: new Date().toISOString()
          })

        if (insertError) {
          console.error(`[generate-perfect-day] Error inserting message for ${subscription.username}:`, insertError)
          continue
        }

        // Update last_sent_at
        const { error: updateError } = await supabase
          .from('perfect_day_subscriptions')
          .update({ last_sent_at: today })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`[generate-perfect-day] Error updating subscription for ${subscription.username}:`, updateError)
        } else {
          console.log(`[generate-perfect-day] Successfully processed ${subscription.username}`)
        }

      } catch (error) {
        console.error(`[generate-perfect-day] Error processing subscription for ${subscription.username}:`, error)
        continue
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: subscriptions?.length || 0,
        events_found: todaysEvents?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[generate-perfect-day] Error in generate-perfect-day function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generatePerfectDayMessage(
  events: any[], 
  userProfile: any, 
  weather: string, 
  date: string
): Promise<string> {
  try {
    // Format events by time of day
    const morningEvents = events.filter(e => {
      const hour = parseInt(e.time.split(':')[0])
      return hour >= 6 && hour < 12
    })
    
    const afternoonEvents = events.filter(e => {
      const hour = parseInt(e.time.split(':')[0])
      return hour >= 12 && hour < 18
    })
    
    const eveningEvents = events.filter(e => {
      const hour = parseInt(e.time.split(':')[0])
      return hour >= 18 || hour < 6
    })

    // Format events for AI prompt
    const formatEventForPrompt = (event: any) => {
      return `${event.title} um ${event.time} (${event.location}, Kategorie: ${event.category})`
    }

    let systemPrompt = `Du bist der Perfect Day Bot für Liebefeld. Erstelle eine persönliche Tagesempfehlung im Format:

🌟 **Dein perfekter Tag in Liebefeld!** 🌟

🌅 **Vormittag**
[Aktivitäten und Events]

🌞 **Nachmittag** 
[Aktivitäten und Events]

🌙 **Abend**
[Aktivitäten und Events]

Wetter heute: [Wetterinfo]

Viel Spaß bei deinem perfekten Tag! 💫

Verfügbare Events heute (${date}):`

    if (morningEvents.length > 0) {
      systemPrompt += `\n\nVormittag-Events:\n${morningEvents.map(formatEventForPrompt).join('\n')}`
    }
    
    if (afternoonEvents.length > 0) {
      systemPrompt += `\n\nNachmittag-Events:\n${afternoonEvents.map(formatEventForPrompt).join('\n')}`
    }
    
    if (eveningEvents.length > 0) {
      systemPrompt += `\n\nAbend-Events:\n${eveningEvents.map(formatEventForPrompt).join('\n')}`
    }

    if (events.length === 0) {
      systemPrompt += `\n\nKeine spezifischen Events heute verfügbar - erstelle allgemeine Empfehlungen für Liebefeld.`
    }

    let userPrompt = `Erstelle meinen perfekten Tag für heute in Liebefeld!`
    
    // Add personalization if user profile exists
    if (userProfile?.interests && userProfile.interests.length > 0) {
      userPrompt += ` Meine Interessen: ${userProfile.interests.join(', ')}.`
      systemPrompt += `\n\nNutzer-Interessen: ${userProfile.interests.join(', ')} - berücksichtige diese bei den Empfehlungen.`
    }
    
    if (userProfile?.favorite_locations && userProfile.favorite_locations.length > 0) {
      userPrompt += ` Bevorzugte Orte: ${userProfile.favorite_locations.join(', ')}.`
      systemPrompt += `\n\nBevorzugte Orte: ${userProfile.favorite_locations.join(', ')} - bevorzuge Events an diesen Orten.`
    }

    systemPrompt += `\n\nWichtig: Integriere die verfügbaren Events in deine Empfehlungen. Ergänze mit allgemeinen Aktivitäten wo keine Events verfügbar sind.`

    console.log('[generate-perfect-day] Calling OpenRouter API...')

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      console.error('[generate-perfect-day] OpenRouter API error:', response.status, response.statusText)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[generate-perfect-day] Invalid OpenRouter response:', data)
      throw new Error('Invalid response from OpenRouter API')
    }

    const aiContent = data.choices[0].message.content
    console.log('[generate-perfect-day] Successfully generated AI content')
    
    return aiContent

  } catch (error) {
    console.error('[generate-perfect-day] Error generating AI message:', error)
    
    // Fallback to static message if AI fails
    const fallbackMessage = `🌟 **Dein perfekter Tag in Liebefeld!** 🌟

🌅 **Vormittag**: Beginne den Tag mit einem Spaziergang oder besuche ein Café

🌞 **Nachmittag**: Entdecke lokale Events oder entspanne im Park  

🌙 **Abend**: Genieße ein gemütliches Abendessen oder besuche ein Event

${events.length > 0 ? `\nHeute sind ${events.length} Events verfügbar!` : ''}

Viel Spaß bei deinem perfekten Tag! 💫`

    return fallbackMessage
  }
}
