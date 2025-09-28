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
    console.log('Starting weekly sport poll function')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate next Tuesday's date for the running event
    const today = new Date()
    const nextTuesday = new Date(today)
    const daysToTuesday = (2 - today.getDay() + 7) % 7 // 2 = Tuesday, 0 = Sunday
    nextTuesday.setDate(today.getDate() + (daysToTuesday === 0 ? 7 : daysToTuesday))
    
    const formattedDate = `${nextTuesday.getDate()}.${nextTuesday.getMonth() + 1}`
    
    const pollQuestion = `Am Di wieder Laufen. Treffpunkt 19 Uhr Gellershagen Park Teich. Wer ist dabei?`
    const pollText = `🏃‍♂️ ${pollQuestion}`
    
    const pollOptions = ["Bin dabei", "diesmal nicht", "kein Interesse"]

    // Insert the poll message into the sport chat group
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: 'bi_sport',
        sender: 'MIA',
        text: pollText,
        poll_question: pollQuestion,
        poll_options: pollOptions,
        poll_votes: {},
        poll_allow_multiple: false, // Single selection for sport polls
        avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting sport poll:', error)
      throw error
    }

    console.log('Successfully sent weekly sport poll:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly sport poll sent successfully',
        data,
        nextTuesdayDate: formattedDate
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in weekly sport poll function:', error)
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