import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getNextSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
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
  );

  try {
    console.log('Starte Samstags-Kennenlernabend Followup...');

    const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';

    // Find the most recent Kennenlernabend poll (posted on Wednesday)
    const { data: recentPolls, error: pollError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('group_id', TRIBE_BOARD_GROUP_ID)
      .eq('sender', 'MIA')
      .not('poll_question', 'is', null)
      .ilike('poll_question', '%Wo treffen wir uns%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pollError) {
      console.error('Fehler beim Laden der Umfrage:', pollError);
      throw pollError;
    }

    if (!recentPolls || recentPolls.length === 0) {
      console.log('Keine aktuelle Kennenlernabend-Umfrage gefunden.');
      return new Response(
        JSON.stringify({ success: false, message: 'Keine aktuelle Umfrage gefunden.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const poll = recentPolls[0];
    const pollVotes = (poll.poll_votes || {}) as Record<string, any[]>;
    const pollOptions = (poll.poll_options || []) as string[];

    // Find the winning option
    let maxVotes = 0;
    let winningIdx = 0;

    Object.entries(pollVotes).forEach(([idx, voters]) => {
      const count = Array.isArray(voters) ? voters.length : 0;
      if (count > maxVotes) {
        maxVotes = count;
        winningIdx = parseInt(idx);
      }
    });

    const winningLocation = pollOptions[winningIdx] || 'Café Barcelona';
    // Strip all leading emoji/special chars and trailing tags
    const cleanLocation = winningLocation.replace(/^[\p{Emoji}\p{Emoji_Component}\s📍🤖]+/u, '').replace(/\s*\(MIA-Tipp\)/, '').trim();
    const totalVoters = Object.values(pollVotes).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    console.log(`Gewinner: ${cleanLocation} mit ${maxVotes} von ${totalVoters} Stimmen`);

    const nextSundayDate = getNextSunday();
    const miaAvatar = '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png';
    const kennenlernabendImageUrl = 'https://liebefeld.lovable.app/images/tribe/tribe-kennenlernabend.jpg';

    const messageText = `📣 Ihr habt abgestimmt – es geht ins **${cleanLocation}**! 🎉

Diesen Sonntag (${nextSundayDate}) ab 18 Uhr treffen wir uns zum Kennenlernabend. Kommt vorbei, lernt neue Leute kennen und genießt den Abend!

Wer ist dabei? 👇

#tribecall #kennenlernabend`;

    const pollQuestion = `Kennenlernabend am ${nextSundayDate} im ${cleanLocation} – Bist du dabei?`;
    const pollOpts = ['🙌 Bin dabei!', '😔 Diesmal nicht'];

    const insertPayload = {
      group_id: TRIBE_BOARD_GROUP_ID,
      sender: 'MIA',
      avatar: miaAvatar,
      text: messageText,
      media_url: kennenlernabendImageUrl,
      poll_question: pollQuestion,
      poll_options: pollOpts,
      poll_votes: {},
      poll_allow_multiple: false,
    };
    console.log('Insert payload:', JSON.stringify(insertPayload));

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert(insertPayload);

    if (insertError) {
      console.error('Fehler beim Posten:', insertError);
      throw insertError;
    }

    console.log(`Samstags-Followup gepostet: ${cleanLocation}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Followup für ${cleanLocation} gepostet.`,
        winningLocation: cleanLocation,
        totalVoters,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Fehler:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
