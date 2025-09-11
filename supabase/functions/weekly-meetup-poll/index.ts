import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('Starting weekly meetup poll function')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate next Sunday's date
    const today = new Date()
    const nextSunday = new Date(today)
    const daysToSunday = 7 - today.getDay() // 0 = Sunday, so we want next Sunday
    nextSunday.setDate(today.getDate() + (daysToSunday === 0 ? 7 : daysToSunday))
    
    const formattedDate = `${nextSunday.getDate()}.${nextSunday.getMonth() + 1}`
    
    const pollQuestion = `Nächster Kennenlernabend am Sonntag ${formattedDate}/19 Uhr - Wo wollen wir uns treffen?`
    const pollText = `📊 ${pollQuestion}`
    
    const pollOptions = ["Café Barcelona", "Le Feu", "Losteria"]

    // Insert the poll message into the chat
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: 'bi_ausgehen',
        sender: 'MIA',
        text: pollText,
        poll_question: pollQuestion,
        poll_options: pollOptions,
        poll_votes: {},
        avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting meetup poll:', error)
      throw error
    }

    console.log('Successfully sent weekly meetup poll:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly meetup poll sent successfully',
        data,
        nextSundayDate: formattedDate
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in weekly meetup poll function:', error)
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