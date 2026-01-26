// supabase/functions/post-weekly-meetup-message/index.ts
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
    console.log('Starte das Posten der wöchentlichen Stammtisch-Nachricht ins Community Board...');

    const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';

    // Stammtisch Nachricht
    const stammtischMessage = `🍻 TRIBE Stammtisch – Jeden Mittwoch!

Hey Leute! Diese Woche ist wieder Stammtisch-Zeit! 🎉

Ob du neu in der Stadt bist, einfach mal raus willst oder schon Teil der Tribe bist – komm vorbei und lerne neue Leute kennen!

📅 **Wann:** Jeden Mittwoch ab 19:30 Uhr
📍 **Wo:** Wird kurzfristig bekannt gegeben

Wer ist dabei? Kommentiere unten! 👇`;

    // Bild-URL für Stammtisch
    const stammtischImageUrl = 'https://liebefeld.lovable.app/images/tribe/tribe-stammtisch.jpg';

    // Post ins Tribe Community Board
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        group_id: TRIBE_BOARD_GROUP_ID,
        sender: 'MIA',
        avatar: '/lovable-uploads/34a26dea-fa36-4fd0-8d70-cd579a646f06.png',
        text: stammtischMessage,
        media_url: stammtischImageUrl,
        read_by: []
      });

    if (insertError) {
      console.error('Fehler beim Posten der Stammtisch-Nachricht:', insertError);
      throw new Error(`Fehler beim Posten: ${insertError.message}`);
    }

    console.log('Stammtisch-Nachricht erfolgreich ins Community Board gepostet!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stammtisch-Nachricht erfolgreich ins Tribe Community Board gepostet.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Fehler in der Edge Function zum Posten der Community-Nachrichten:', error);
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