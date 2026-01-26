// supabase/functions/post-weekly-tuesday-run/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {  
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Starte das Posten der wöchentlichen Tuesday Run Nachricht ins Community Board...');

    const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';

    // Berechne das Datum des nächsten Dienstags
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sonntag, 1 = Montag, 2 = Dienstag, ...
    const daysUntilTuesday = dayOfWeek <= 2 ? 2 - dayOfWeek : 9 - dayOfWeek;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    
    const formattedDate = nextTuesday.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    // Tuesday Run Nachricht
    const tuesdayRunMessage = `🏃 TRIBE Tuesday Run – Jeden Dienstag!

Hey Sportler! Diese Woche ist wieder Lauftreff-Zeit! 💪

Egal ob Anfänger oder Profi – jeder ist willkommen! Wir laufen gemeinsam eine entspannte Runde und genießen den Feierabend.

📅 **Wann:** ${formattedDate}, 17:00 Uhr
📍 **Wo:** Gellershagen Park Teich

Wer ist dabei? Kommentiere unten! 👇`;

    // Bild-URL für Tuesday Run
    const tuesdayRunImageUrl = 'https://liebefeld.lovable.app/images/tribe/tribe-tuesday-run.jpg';

    // Post ins Tribe Community Board
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        group_id: TRIBE_BOARD_GROUP_ID,
        sender: 'MIA',
        avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png',
        text: tuesdayRunMessage,
        media_url: tuesdayRunImageUrl,
        read_by: []
      });

    if (insertError) {
      console.error('Fehler beim Posten der Tuesday Run Nachricht:', insertError);
      throw new Error(`Fehler beim Posten: ${insertError.message}`);
    }

    console.log('Tuesday Run Nachricht erfolgreich ins Community Board gepostet!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tuesday Run Nachricht erfolgreich ins Tribe Community Board gepostet.',
        nextTuesday: formattedDate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Fehler in der Edge Function zum Posten der Tuesday Run Nachricht:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
