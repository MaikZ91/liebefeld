// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?no-dts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting monthly creative circle function')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate the last Friday of the current month
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Get the last day of the current month
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    
    // Find the last Friday
    let lastFriday = new Date(lastDayOfMonth)
    while (lastFriday.getDay() !== 5) { // 5 = Friday
      lastFriday.setDate(lastFriday.getDate() - 1)
    }
    
    const formattedDate = `${lastFriday.getDate()}.${lastFriday.getMonth() + 1}`
    
    const messageText = `#kreativität 🌟 Creative Circle – Sei Teil der Show!🌟
 
Am ${formattedDate} verwandeln wir den CoWorking Space, Merianstr. 8 wieder in einen Ort voller Ideen, Sounds und Inspiration. 🎶🎨✨
 
🕖 Zeit: 19 Uhr
 
👉 Mach mit! Schreib vorher rein, was du beisteuern möchtest – ob kleines Konzert, Jam Session, Ausstellung oder etwas ganz anderes. So können wir den Abend gemeinsam gestalten und alle wissen schon vorher, worauf sie sich freuen dürfen.
 
💡 Der Creative Circle lebt von dir und deiner Kreativität. Also: Bühne frei für deine Ideen! 🚀`

    // Insert the message into the ausgehen chat group
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: 'bi_ausgehen',
        sender: 'MIA',
        text: messageText,
        avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting creative circle message:', error)
      throw error
    }

    console.log('Successfully sent monthly creative circle message:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monthly creative circle message sent successfully',
        data,
        lastFridayDate: formattedDate
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in monthly creative circle function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})