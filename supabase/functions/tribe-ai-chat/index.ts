import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      events, 
      generateSummary, 
      enhancePost,
      userProfile,
      city
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create Supabase client for database access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let systemPrompt = '';
    let userPrompt = message;

    if (generateSummary) {
      systemPrompt = 'Du bist ein Event-Experte. Erstelle eine 2-Satz Zusammenfassung auf Deutsch, die die Vibe und das Genre des Events beschreibt. Sei cool und informativ.';
    } else if (enhancePost) {
      systemPrompt = 'Du bist ein Social Media Experte. Optimiere den Post-Text für maximale Engagement, mache ihn cooler und füge passende Hashtags hinzu. Antworte nur mit dem optimierten Text und Hashtags.';
    } else {
      // Fetch community meetups from chat_messages
      let communityMeetups: any[] = [];
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: meetupMessages, error: meetupError } = await supabase
          .from('chat_messages')
          .select('*')
          .or('text.ilike.%meetup%,text.ilike.%treffen%,text.ilike.%wer hat lust%,text.ilike.%wer kommt%,text.ilike.%bin dabei%')
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!meetupError && meetupMessages) {
          communityMeetups = meetupMessages.map(msg => ({
            type: 'community_meetup',
            text: msg.text,
            sender: msg.sender,
            time: msg.created_at,
            event_title: msg.event_title,
            event_location: msg.event_location,
            event_date: msg.event_date,
            responses: msg.meetup_responses
          }));
        }
      } catch (e) {
        console.error('Error fetching community meetups:', e);
      }

      // Build event context with likes/ranking
      const eventContext = events?.length > 0 
        ? `\n\n📅 VERFÜGBARE EVENTS (sortiert nach Beliebtheit):\n${events.map((e: any, idx: number) => 
            `${idx + 1}. "${e.title}" (${e.category}) am ${e.date} um ${e.time || 'TBA'} in ${e.location || e.city}${e.likes ? ` - ❤️ ${e.likes} Likes` : ''}${e.matchScore ? ` - 🎯 ${e.matchScore}% Match` : ''}`
          ).join('\n')}`
        : '';

      // Build community meetups context
      const meetupContext = communityMeetups.length > 0
        ? `\n\n👥 COMMUNITY MEETUPS & AKTIVITÄTEN:\n${communityMeetups.map((m, idx) => 
            `${idx + 1}. ${m.sender} schreibt: "${m.text.substring(0, 150)}..."${m.event_title ? ` (Event: ${m.event_title})` : ''}${m.event_location ? ` in ${m.event_location}` : ''}`
          ).join('\n')}`
        : '';

      // Build user profile context for personalization
      let profileContext = '';
      if (userProfile) {
        const interests = userProfile.interests?.length > 0 
          ? `Interessen: ${userProfile.interests.join(', ')}` 
          : '';
        const locations = userProfile.favorite_locations?.length > 0 
          ? `Lieblingsorte: ${userProfile.favorite_locations.join(', ')}` 
          : '';
        const hobbies = userProfile.hobbies?.length > 0 
          ? `Hobbies: ${userProfile.hobbies.join(', ')}` 
          : '';
        
        if (interests || locations || hobbies) {
          profileContext = `\n\n👤 NUTZERPROFIL:\nName: ${userProfile.username || 'Unbekannt'}\n${interests}\n${locations}\n${hobbies}`;
        }
      }

      systemPrompt = `Du bist MIA, die AI-Concierge von THE TRIBE - einer urbanen Community-App für Events und Aktivitäten. 
Du bist cool, urban, und hilfreich. Antworte immer auf Deutsch in einem lockeren, freundlichen Ton.

WICHTIGE REGELN:
1. Berücksichtige IMMER das Nutzerprofil für personalisierte Empfehlungen
2. Bevorzuge Events an Lieblingsorten des Nutzers
3. Priorisiere Events, die zu den Interessen des Nutzers passen
4. Erwähne Community-Meetups wenn relevant (z.B. "In der Community plant jemand...")
5. Nenne konkrete Event-Titel und Details
6. Bei Fragen wie "was geht heute" oder "was ist los" - checke sowohl Events als auch Community-Meetups
7. Wenn jemand nach Gesellschaft sucht, erwähne passende Community-Aktivitäten
8. Zeige Begeisterung für Events die zum Nutzer passen könnten

Stadt/Region: ${city || 'Bielefeld'}
${profileContext}${eventContext}${meetupContext}`;
    }

    console.log('[tribe-ai-chat] Calling AI with context length:', systemPrompt.length);

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.';

    if (enhancePost) {
      const hashtagMatch = reply.match(/#\w+/g) || [];
      const optimizedText = reply.replace(/#\w+/g, '').trim();
      return new Response(
        JSON.stringify({ optimizedText, hashtags: hashtagMatch }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract related events from AI response if event titles are mentioned
    const relatedEvents = events?.filter((e: any) => 
      reply.toLowerCase().includes(e.title.toLowerCase())
    ) || [];

    return new Response(
      JSON.stringify({ reply, relatedEvents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('tribe-ai-chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
