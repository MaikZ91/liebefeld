import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?no-dts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🌅 [Daily Top Events] Starting daily top events post...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay(); // 0=Sunday, 2=Tuesday

    console.log(`🗓️ [Daily Top Events] Date: ${todayStr}, Day: ${dayOfWeek}`);

    // Check duplicate
    const { data: existingMessages } = await supabaseClient
      .from('chat_messages')
      .select('id')
      .eq('group_id', 'tribe_community_board')
      .eq('sender', 'MIA')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lt('created_at', `${todayStr}T23:59:59`)
      .ilike('text', '%top events des tages%');

    if (existingMessages && existingMessages.length > 0) {
      console.log('✅ [Daily Top Events] Already posted today, skipping.');
      return new Response(JSON.stringify({ success: true, message: 'Already posted today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch today's events sorted by likes desc
    const { data: events, error: eventsError } = await supabaseClient
      .from('community_events')
      .select('*')
      .eq('date', todayStr)
      .order('likes', { ascending: false })
      .limit(20);

    if (eventsError) {
      console.error('❌ [Daily Top Events] Error fetching events:', eventsError);
      throw eventsError;
    }

    const allEvents = events || [];
    console.log(`📋 [Daily Top Events] Found ${allEvents.length} events for today`);

    // Build top 3 list with fixed Tribe events on specific days
    const topEvents: any[] = [];

    // Sunday = Tribe Kennenlernabend always #1
    if (dayOfWeek === 0) {
      const kennenlernabend = allEvents.find(e =>
        e.title?.toLowerCase().includes('kennenlernabend') ||
        e.title?.toLowerCase().includes('stammtisch')
      );
      if (kennenlernabend) {
        topEvents.push(kennenlernabend);
      } else {
        // Create a virtual entry
        topEvents.push({
          title: 'TRIBE Kennenlernabend',
          time: '18:00',
          location: 'Wird im Chat bekannt gegeben',
          category: 'ausgehen',
          image_url: 'https://liebefeld.lovable.app/images/tribe/tribe-kennenlernabend.jpg',
          likes: 0,
          description: 'Jeden Sonntag treffen wir uns zum gemütlichen Kennenlernabend. Neue Leute, gute Gespräche!',
        });
      }
    }

    // Tuesday = Tuesday Run always #1
    if (dayOfWeek === 2) {
      const tuesdayRun = allEvents.find(e =>
        e.title?.toLowerCase().includes('tuesday run') ||
        e.title?.toLowerCase().includes('dienstagslauf')
      );
      if (tuesdayRun) {
        topEvents.push(tuesdayRun);
      } else {
        topEvents.push({
          title: 'TRIBE Tuesday Run',
          time: '17:00',
          location: 'Gellershagen Park Teich',
          category: 'sport',
          image_url: 'https://liebefeld.lovable.app/images/tribe/tribe-tuesday-run.jpg',
          likes: 0,
          description: 'Jeden Dienstag laufen wir zusammen – egal ob Anfänger oder Profi!',
        });
      }
    }

    // Fill remaining slots from top liked events (exclude already added)
    const addedTitles = new Set(topEvents.map(e => e.title?.toLowerCase()));
    for (const event of allEvents) {
      if (topEvents.length >= 3) break;
      if (!addedTitles.has(event.title?.toLowerCase())) {
        topEvents.push(event);
        addedTitles.add(event.title?.toLowerCase());
      }
    }

    if (topEvents.length === 0) {
      console.log('📭 [Daily Top Events] No events found for today');
      
      const noEventsMsg = `🌅 **Top Events des Tages**

Heute scheint ein ruhiger Tag zu sein – keine Events gefunden.

Perfekt, um selbst etwas zu planen! 💡

_– MIA_`;

      await supabaseClient.from('chat_messages').insert({
        group_id: 'tribe_community_board',
        sender: 'MIA',
        text: noEventsMsg,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        read_by: [],
      });

      return new Response(JSON.stringify({ success: true, message: 'No events message sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format the date nicely
    const dateFormatted = today.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    // Build message with top events
    let eventLines = '';
    const imageUrls: string[] = [];

    topEvents.slice(0, 3).forEach((event, i) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      const timeStr = event.time && event.time !== '00:00' ? ` · ${event.time} Uhr` : '';
      const locationStr = event.location ? ` · 📍 ${event.location}` : '';
      const likesStr = event.likes > 0 ? ` · ❤️ ${event.likes}` : '';

      eventLines += `\n${emoji} **${event.title}**${timeStr}${locationStr}${likesStr}\n`;

      if (event.image_url) {
        imageUrls.push(event.image_url);
      }
    });

    const messageText = `🌅 **Top Events des Tages** – ${dateFormatted}
${eventLines}
Welches Event ist euer Favorit? Liked & kommentiert! 👇

#topevents`;

    // Post message (use first image as media_url if available)
    const { error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        group_id: 'tribe_community_board',
        sender: 'MIA',
        text: messageText,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        media_url: imageUrls[0] || null,
        read_by: [],
      });

    if (messageError) {
      console.error('❌ [Daily Top Events] Error posting message:', messageError);
      throw messageError;
    }

    console.log('✅ [Daily Top Events] Posted successfully with', topEvents.length, 'events');

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily top events posted',
      events: topEvents.slice(0, 3).map(e => ({ title: e.title, likes: e.likes })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [Daily Top Events] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send daily top events',
      details: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
