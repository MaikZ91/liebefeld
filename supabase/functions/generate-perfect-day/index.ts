
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current weather (simplified for now)
    const currentWeather = 'sunny'; // In real implementation, fetch from weather API
    
    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('perfect_day_subscriptions')
      .select('*')
      .eq('is_active', true)
      .or(`last_sent_at.is.null,last_sent_at.lt.${new Date().toISOString().split('T')[0]}`)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      throw subError
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`)

    // Process each subscription
    for (const subscription of subscriptions || []) {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', subscription.username)
          .single()

        // Get today's events
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase
          .from('community_events')
          .select('*')
          .eq('date', today)
          .limit(10)

        // Get activity suggestions based on weather
        const { data: activities } = await supabase
          .from('activity_suggestions')
          .select('*')
          .eq('weather', currentWeather)
          .limit(6)

        // Generate personalized suggestions
        const morningActivities = activities?.filter(a => a.time_of_day === 'morning') || []
        const afternoonActivities = activities?.filter(a => a.time_of_day === 'afternoon') || []
        const eveningActivities = activities?.filter(a => a.time_of_day === 'evening') || []

        // Create message content
        let messageContent = `🌟 **Dein perfekter Tag in Liebefeld!** 🌟\n\n`
        
        messageContent += `🌅 **Vormittag**\n`
        if (morningActivities.length > 0) {
          messageContent += `• ${morningActivities[0].activity}\n`
        } else {
          messageContent += `• Starte mit einem entspannten Kaffee\n`
        }
        
        messageContent += `\n🌞 **Nachmittag**\n`
        if (events && events.length > 0) {
          const afternoonEvent = events.find(e => {
            const hour = parseInt(e.time.split(':')[0])
            return hour >= 12 && hour < 18
          })
          if (afternoonEvent) {
            messageContent += `• ${afternoonEvent.title} um ${afternoonEvent.time} (${afternoonEvent.location})\n`
          }
        }
        if (afternoonActivities.length > 0) {
          messageContent += `• ${afternoonActivities[0].activity}\n`
        }
        
        messageContent += `\n🌙 **Abend**\n`
        if (events && events.length > 0) {
          const eveningEvent = events.find(e => {
            const hour = parseInt(e.time.split(':')[0])
            return hour >= 18
          })
          if (eveningEvent) {
            messageContent += `• ${eveningEvent.title} um ${eveningEvent.time} (${eveningEvent.location})\n`
          }
        }
        if (eveningActivities.length > 0) {
          messageContent += `• ${eveningActivities[0].activity}\n`
        }
        
        messageContent += `\nWetter heute: ${currentWeather === 'sunny' ? '☀️ Sonnig' : '🌧️ Regnerisch'}\n\nViel Spaß bei deinem perfekten Tag! 💫`

        // Instead of inserting into chat_messages, we'll store these messages in a dedicated table
        // or send them via a different mechanism that doesn't interfere with community chat
        
        // For now, we'll just log the message and update the subscription status
        // The AI chat interface can fetch these messages through a separate endpoint
        console.log(`Perfect Day message for ${subscription.username}:`, messageContent)

        // Update last_sent_at
        await supabase
          .from('perfect_day_subscriptions')
          .update({ last_sent_at: new Date().toISOString().split('T')[0] })
          .eq('id', subscription.id)

        console.log(`Perfect Day message prepared for ${subscription.username}`)

      } catch (error) {
        console.error(`Error processing subscription for ${subscription.username}:`, error)
        continue
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: subscriptions?.length || 0 }),
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
