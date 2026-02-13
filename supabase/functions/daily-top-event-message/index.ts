import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?no-dts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category-based fallback images
const categoryImages: Record<string, string> = {
  'party': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  'ausgehen': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&h=400&fit=crop',
  'konzert': 'https://images.unsplash.com/photo-1501386761578-eac5c94b0571?w=600&h=400&fit=crop',
  'kreativität': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop',
  'sport': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop',
  'kino': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
  'kultur': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
};

// Priority categories (Party > Ausgehen > Konzert > Kreativität > Sport > rest)
const categoryPriority: Record<string, number> = {
  'party': 0,
  'ausgehen': 1,
  'konzert': 2,
  'kreativität': 3,
  'sport': 4,
  'kino': 5,
};

function getEventImage(event: any): string {
  if (event.image_url) return event.image_url;
  const cat = (event.category || '').toLowerCase();
  return categoryImages[cat] || categoryImages['ausgehen'];
}

function getCategoryScore(category: string): number {
  const cat = category?.toLowerCase() || '';
  return categoryPriority[cat] ?? 99;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🌅 [Daily Top Events] Starting...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();

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
      console.log('✅ Already posted today, skipping.');
      return new Response(JSON.stringify({ success: true, message: 'Already posted today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch today's events – get more to have good selection
    const { data: events, error: eventsError } = await supabaseClient
      .from('community_events')
      .select('*')
      .eq('date', todayStr)
      .order('likes', { ascending: false })
      .limit(50);

    if (eventsError) throw eventsError;

    const allEvents = events || [];
    console.log(`📋 Found ${allEvents.length} events for today`);

    // Sort by: likes DESC, then category priority (Party first), then time
    const sortedEvents = [...allEvents].sort((a, b) => {
      // First by likes
      const likeDiff = (b.likes || 0) - (a.likes || 0);
      if (likeDiff !== 0) return likeDiff;
      // Then by category priority (Party > Ausgehen > Konzert > ...)
      const catDiff = getCategoryScore(a.category) - getCategoryScore(b.category);
      if (catDiff !== 0) return catDiff;
      // Then by time (evening events preferred)
      return (b.time || '00:00').localeCompare(a.time || '00:00');
    });

    // Filter out boring "Bildung" / VHS events unless nothing else
    const funEvents = sortedEvents.filter(e => {
      const cat = (e.category || '').toLowerCase();
      return cat !== 'bildung' && cat !== 'sonstiges';
    });

    const topPool = funEvents.length >= 3 ? funEvents : sortedEvents;

    // Build top 3 with fixed Tribe events on specific days
    const topEvents: any[] = [];
    const addedIds = new Set<string>();

    // Sunday = Tribe Kennenlernabend always #1
    if (dayOfWeek === 0) {
      const kennenlernabend = allEvents.find(e =>
        e.title?.toLowerCase().includes('kennenlernabend') ||
        e.title?.toLowerCase().includes('stammtisch')
      );
      if (kennenlernabend) {
        topEvents.push(kennenlernabend);
        addedIds.add(kennenlernabend.id);
      } else {
        topEvents.push({
          id: 'tribe-kennenlernabend',
          title: 'TRIBE Kennenlernabend',
          time: '18:00',
          location: 'Wird im Chat bekannt gegeben',
          category: 'Ausgehen',
          image_url: 'https://liebefeld.lovable.app/images/tribe/tribe-kennenlernabend.jpg',
          likes: 0,
        });
        addedIds.add('tribe-kennenlernabend');
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
        addedIds.add(tuesdayRun.id);
      } else {
        topEvents.push({
          id: 'tribe-tuesday-run',
          title: 'TRIBE Tuesday Run',
          time: '17:00',
          location: 'Gellershagen Park Teich',
          category: 'Sport',
          image_url: 'https://liebefeld.lovable.app/images/tribe/tribe-tuesday-run.jpg',
          likes: 0,
        });
        addedIds.add('tribe-tuesday-run');
      }
    }

    // Fill remaining slots from fun events
    for (const event of topPool) {
      if (topEvents.length >= 3) break;
      if (addedIds.has(event.id)) continue;
      // Clean up ugly long VHS-style titles
      topEvents.push(event);
      addedIds.add(event.id);
    }

    if (topEvents.length === 0) {
      const noEventsMsg = `🌅 **Top Events des Tages**\n\nHeute scheint ein ruhiger Tag zu sein – keine Events gefunden.\n\nPerfekt, um selbst etwas zu planen! 💡\n\n_– MIA_`;
      await supabaseClient.from('chat_messages').insert({
        group_id: 'tribe_community_board',
        sender: 'MIA',
        text: noEventsMsg,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        read_by: [],
      });
      return new Response(JSON.stringify({ success: true, message: 'No events' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateFormatted = today.toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    // Clean title: remove VHS-style noise like "Wann: ab Fr..." 
    const cleanTitle = (title: string) => {
      // Remove everything after \r\n or "Wann:"
      let clean = title.split(/\r?\n/)[0].trim();
      // Remove (@location) suffix
      clean = clean.replace(/\s*\(@[^)]+\)\s*$/, '');
      // Limit length
      if (clean.length > 60) clean = clean.substring(0, 57) + '...';
      return clean;
    };

    // Build message with images inline
    let eventLines = '';
    const top3 = topEvents.slice(0, 3);

    top3.forEach((event, i) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      const timeStr = event.time && event.time !== '00:00' ? ` · ${String(event.time).substring(0, 5)} Uhr` : '';
      const locationStr = event.location ? ` · 📍 ${event.location}` : '';
      const likesStr = event.likes > 0 ? ` · ❤️ ${event.likes}` : '';
      const img = getEventImage(event);

      eventLines += `\n${emoji} **${cleanTitle(event.title)}**\n🏷️ ${event.category}${timeStr}${locationStr}${likesStr}\n🖼️ ${img}\n`;
    });

    const messageText = `🌅 **Top Events des Tages** – ${dateFormatted}
${eventLines}
Welches Event ist euer Favorit? Liked & kommentiert! 👇

#topevents`;

    // Use first event image as media_url for the post thumbnail
    const mainImage = getEventImage(top3[0]);

    const { error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        group_id: 'tribe_community_board',
        sender: 'MIA',
        text: messageText,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        media_url: mainImage,
        read_by: [],
      });

    if (messageError) throw messageError;

    console.log('✅ Posted with', top3.length, 'events:', top3.map(e => e.title));

    return new Response(JSON.stringify({
      success: true,
      events: top3.map(e => ({ title: cleanTitle(e.title), category: e.category, likes: e.likes })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
