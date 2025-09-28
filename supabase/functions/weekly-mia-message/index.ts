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
    console.log('Starting weekly MIA message function')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const miaMessage = `#ausgehen Hallo liebe Tribes,

hier kommen meine Empfehlungen für eure nächste Woche:

MO: POWERWORKOURT (18 Uhr @Gellershagenpark Teich)

DI: TUESDAY RUN (19 Uhr @Gellershagenpark Teich)

MI: BOULDERN (18 Uhr @Kletterhalle Senne)

DO: FUSSBALL (18 Uhr @Obersee Fußballplatz)

FR: CREATIVE CIRCLE(19 Uhr @CoWORKING SPACE MERIANSTR: 8 -> Anmeldung bei Maik)

SA: WANDERSAMSTAG (14 Uhr Kunsthalle BI -> Schwedenschanze)

SO: TRIBE KENNENLERNABEND (18 Uhr Cafe Barcelona, Min. Anzahl Teilnehmer: 5)

Tragt euch in den Kalender ein, wer & wo dabei ist. Bei Wünschen & Vorschlägen schreibt es einfach in den Community Chat.

Viel Spaß beim Verbinden wünscht eure Mia!:)

(Da der Kalender noch nicht soo super zuverlässig funktioniert und für alle iOS Nutzer: schreibt bitte auch parallel in den Chat "Aktivität"

Eure MIA.`

    // Insert the message into the chat
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: 'bi_ausgehen',
        sender: 'MIA',
        text: miaMessage,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png', // Using default avatar
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting MIA message:', error)
      throw error
    }

    console.log('Successfully sent weekly MIA message:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly MIA message sent successfully',
        data 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in weekly MIA message function:', error)
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