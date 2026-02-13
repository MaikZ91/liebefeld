import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOCATION_POOL = [
  'Café Barcelona',
  'Fabel',
  'Le Feu',
  "L'osteria",
  'Capvin',
  'Bernstein',
  'Peter Pan',
  'Hans im Glück',
  'The Good Hood',
  'Mokkaklatsch',
  'Nichtschwimmer',
];

/**
 * Get the date of the next (or current) Sunday
 */
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

/**
 * Pick N random unique items from array
 */
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * Use AI to suggest a 3rd location that's open on Sunday evening in Bielefeld
 */
async function getAISuggestion(excludeLocations: string[]): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    console.warn('No OPENROUTER_API_KEY, falling back to pool');
    // Fallback: pick from remaining pool
    const remaining = LOCATION_POOL.filter(l => !excludeLocations.includes(l));
    return remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : 'Café Barcelona';
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein lokaler Bielefeld-Experte. Antworte NUR mit dem Namen eines Lokals, nichts anderes. Kein Satzzeichen, keine Erklärung.'
          },
          {
            role: 'user',
            content: `Nenne mir ein Lokal/Restaurant/Bar in Bielefeld, das sonntags ab 18 Uhr geöffnet hat und sich gut für einen Kennenlernabend mit 5-15 Leuten eignet. Es darf KEINES dieser Lokale sein: ${excludeLocations.join(', ')}. Antworte nur mit dem Namen.`
          }
        ],
        max_tokens: 50,
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      console.error('AI response error:', response.status);
      const remaining = LOCATION_POOL.filter(l => !excludeLocations.includes(l));
      return remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : 'Café Barcelona';
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    
    if (suggestion && suggestion.length > 1 && suggestion.length < 100) {
      return suggestion;
    }
    
    const remaining = LOCATION_POOL.filter(l => !excludeLocations.includes(l));
    return remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : 'Café Barcelona';
  } catch (error) {
    console.error('AI suggestion error:', error);
    const remaining = LOCATION_POOL.filter(l => !excludeLocations.includes(l));
    return remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : 'Café Barcelona';
  }
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
    console.log('Starte Kennenlernabend Location-Poll...');

    const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';
    const nextSundayDate = getNextSunday();

    // Pick 2 random locations from pool
    const twoFromPool = pickRandom(LOCATION_POOL, 2);
    
    // Get AI suggestion for 3rd location
    const aiSuggestion = await getAISuggestion(twoFromPool);
    
    const pollOptions = [
      `📍 ${twoFromPool[0]}`,
      `📍 ${twoFromPool[1]}`,
      `🤖 ${aiSuggestion} (MIA-Tipp)`,
    ];

    console.log('Poll options:', pollOptions);

    const miaAvatar = '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png';
    const kennenlernabendImageUrl = 'https://liebefeld.lovable.app/images/tribe/tribe-kennenlernabend.jpg';

    const messageText = `🍻 TRIBE Kennenlernabend – Sonntag, ${nextSundayDate} ab 18 Uhr!

Hey! Diesen Sonntag treffen wir uns wieder zum Kennenlernabend. Aber: **Ihr entscheidet wo!** 🗳️

Stimmt unten für euer Lieblings-Lokal ab – oder schreibt in die Kommentare, wenn ihr einen ganz anderen Vorschlag habt! Jede Idee zählt. 💡

Let's make it happen! 🔥

#tribecall #kennenlernabend`;

    // Post as poll message
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        group_id: TRIBE_BOARD_GROUP_ID,
        sender: 'MIA',
        avatar: miaAvatar,
        text: messageText,
        media_url: kennenlernabendImageUrl,
        poll_question: `Wo treffen wir uns am Sonntag, ${nextSundayDate}?`,
        poll_options: pollOptions,
        poll_votes: {},
        poll_allow_multiple: false,
        read_by: [],
      });

    if (insertError) {
      console.error('Fehler beim Posten:', insertError);
      throw new Error(`Fehler beim Posten: ${insertError.message}`);
    }

    console.log(`Kennenlernabend-Poll für ${nextSundayDate} erfolgreich gepostet! Optionen: ${pollOptions.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Kennenlernabend-Poll für ${nextSundayDate} gepostet.`,
        options: pollOptions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Fehler:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
