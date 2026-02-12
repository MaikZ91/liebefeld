import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userProfile, newEvents, newMembers, topEvents, city } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const eventsContext = (newEvents || []).map((e: any) =>
      `"${e.title}" (${e.category}) am ${e.date} in ${e.location || e.city || city}`
    ).join('\n');

    const membersContext = (newMembers || []).map((m: any) =>
      `${m.username} – Interessen: ${(m.interests || []).join(', ') || 'keine angegeben'}`
    ).join('\n');

    const topContext = (topEvents || []).map((e: any) =>
      `"${e.title}" (${e.category}) – ${e.likes || 0} Likes`
    ).join('\n');

    const profileInfo = userProfile
      ? `Name: ${userProfile.username}, Interessen: ${(userProfile.interests || []).join(', ')}, Hobbies: ${(userProfile.hobbies || []).join(', ')}`
      : 'Kein Profil';

    const systemPrompt = `Du bist MIA, die Community-Assistentin von THE TRIBE. Erstelle 3-5 kurze, persönliche Push-Benachrichtigungen basierend auf dem Kontext.

REGELN:
- Maximal 1-2 Sätze pro Notification
- Lockerer, freundlicher Ton mit Emojis
- Personalisiert basierend auf User-Interessen
- Jede Notification hat einen type (new_event, new_member, daily_recommendation, event_like, upcoming_tribe)
- Jede hat ein actionLabel und actionType (view_event, view_profile, rsvp, chat_mia)
- Bei Events: actionPayload = event ID

Antworte NUR mit validem JSON Array.`;

    const userPrompt = `USER PROFIL:
${profileInfo}

NEUE EVENTS:
${eventsContext || 'Keine neuen Events'}

NEUE MITGLIEDER:
${membersContext || 'Keine neuen Mitglieder'}

BELIEBTE EVENTS:
${topContext || 'Keine Top-Events'}

Stadt: ${city || 'Bielefeld'}

Erstelle personalisierte Notifications als JSON Array mit Objekten: {type, text, actionLabel, actionType, actionPayload}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '[]';

    // Parse JSON from reply
    let notifications = [];
    try {
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        notifications = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI notifications:', e);
    }

    return new Response(
      JSON.stringify({ notifications }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('mia-notifications error:', error);
    return new Response(
      JSON.stringify({ error: error.message, notifications: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
