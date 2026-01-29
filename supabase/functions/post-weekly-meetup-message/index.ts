// supabase/functions/post-weekly-meetup-message/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {  
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Get the date of the next (or current) Sunday
 */
function getNextSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days until next Sunday (if today is Sunday, use today)
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  
  // Format as "DD.MM.YYYY"
  const day = String(nextSunday.getDate()).padStart(2, '0');
  const month = String(nextSunday.getMonth() + 1).padStart(2, '0');
  const year = nextSunday.getFullYear();
  
  return `${day}.${month}.${year}`;
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
    console.log('Starte das Posten der wöchentlichen Kennenlernabend-Nachricht ins Community Board...');

    const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';
    
    // Get the date of the next Sunday
    const nextSundayDate = getNextSunday();

    // Kennenlernabend Nachricht mit dynamischem Datum
    const kennenlernabendMessage = `🍻 TRIBE Kennenlernabend – Jeden Sonntag!

Hey Leute! Diese Woche ist wieder Stammtisch-Zeit! 🎉

Ob du neu in der Stadt bist, einfach mal raus willst oder schon Teil der Tribe bist – komm vorbei und lerne neue Leute kennen!

📅 **Wann:** Sonntag, ${nextSundayDate} ab 18:00 Uhr
📍 **Wo:** Café Barcelona

Wer ist dabei? Kommentiere unten! 👇

#tribecall`;

    // Bild-URL für Kennenlernabend
    const kennenlernabendImageUrl = 'https://liebefeld.lovable.app/images/tribe/tribe-kennenlernabend.jpg';

    // MIA Avatar (neueste Version)
    const miaAvatar = '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png';

    // Post ins Tribe Community Board
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        group_id: TRIBE_BOARD_GROUP_ID,
        sender: 'MIA',
        avatar: miaAvatar,
        text: kennenlernabendMessage,
        media_url: kennenlernabendImageUrl,
        read_by: []
      });

    if (insertError) {
      console.error('Fehler beim Posten der Kennenlernabend-Nachricht:', insertError);
      throw new Error(`Fehler beim Posten: ${insertError.message}`);
    }

    console.log(`Kennenlernabend-Nachricht für ${nextSundayDate} erfolgreich ins Community Board gepostet!`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Kennenlernabend-Nachricht für ${nextSundayDate} erfolgreich ins Tribe Community Board gepostet.`
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
