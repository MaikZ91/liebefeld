import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?no-dts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

const categoryImages: Record<string, string> = {
  'party': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  'ausgehen': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&h=400&fit=crop',
  'konzert': 'https://images.unsplash.com/photo-1501386761578-eac5c94b0571?w=600&h=400&fit=crop',
  'kreativität': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop',
  'sport': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop',
  'kino': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
};

// Blocked title keywords – these events should never appear in top highlights
const BLOCKED_TITLE_KEYWORDS = ['cutie', 'live'];

const categoryPriority: Record<string, number> = {
  'party': 0, 'ausgehen': 1, 'konzert': 2, 'kreativität': 3, 'sport': 4, 'kino': 5,
};

function getEventImage(event: any): string {
  if (event.image_url) return event.image_url;
  const cat = (event.category || '').toLowerCase();
  return categoryImages[cat] || categoryImages['ausgehen'];
}

function getCategoryScore(category: string): number {
  return categoryPriority[(category || '').toLowerCase()] ?? 99;
}

function cleanTitle(title: string): string {
  let clean = title.split(/\r?\n/)[0].trim();
  clean = clean.replace(/\s*\(@[^)]+\)\s*$/, '');
  if (clean.length > 50) clean = clean.substring(0, 47) + '...';
  return clean;
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
      .ilike('text', '%#topevents%');

    if (existingMessages && existingMessages.length > 0) {
      return new Response(JSON.stringify({ success: true, message: 'Already posted today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch today's events, only Bielefeld
    const { data: events, error: eventsError } = await supabaseClient
      .from('community_events')
      .select('*')
      .eq('date', todayStr)
      .or('city.is.null,city.ilike.Bielefeld,city.ilike.bi')
      .order('likes', { ascending: false })
      .limit(50);

    if (eventsError) throw eventsError;

    const allEvents = events || [];

    // Sort: likes > category priority > evening time
    const sortedEvents = [...allEvents].sort((a, b) => {
      const likeDiff = (b.likes || 0) - (a.likes || 0);
      if (likeDiff !== 0) return likeDiff;
      const catDiff = getCategoryScore(a.category) - getCategoryScore(b.category);
      if (catDiff !== 0) return catDiff;
      return (b.time || '00:00').localeCompare(a.time || '00:00');
    });

    // Filter out boring categories
    const funEvents = sortedEvents.filter(e => {
      const cat = (e.category || '').toLowerCase();
      const titleLower = (e.title || '').toLowerCase();
      // Filter out boring categories and blocked keywords
      if (cat === 'bildung' || cat === 'sonstiges') return false;
      if (BLOCKED_TITLE_KEYWORDS.some(kw => titleLower.includes(kw))) return false;
      return true;
    });
    const topPool = funEvents.length >= 3 ? funEvents : sortedEvents;

    // Build top 3
    const topEvents: any[] = [];
    const addedIds = new Set<string>();

    if (dayOfWeek === 0) {
      const k = allEvents.find(e => e.title?.toLowerCase().includes('kennenlernabend') || e.title?.toLowerCase().includes('stammtisch'));
      if (k) { topEvents.push(k); addedIds.add(k.id); }
      else topEvents.push({ id: 'tribe-kennenlernabend', title: 'TRIBE Kennenlernabend', time: '18:00', location: 'Wird im Chat bekannt gegeben', category: 'Ausgehen', image_url: 'https://liebefeld.lovable.app/images/tribe/tribe-kennenlernabend.jpg', likes: 0 });
    }
    if (dayOfWeek === 2) {
      const t = allEvents.find(e => e.title?.toLowerCase().includes('tuesday run') || e.title?.toLowerCase().includes('dienstagslauf'));
      if (t) { topEvents.push(t); addedIds.add(t.id); }
      else topEvents.push({ id: 'tribe-tuesday-run', title: 'TRIBE Tuesday Run', time: '17:00', location: 'Gellershagen Park Teich', category: 'Sport', image_url: 'https://liebefeld.lovable.app/images/tribe/tribe-tuesday-run.jpg', likes: 0 });
    }

    for (const event of topPool) {
      if (topEvents.length >= 3) break;
      if (addedIds.has(event.id)) continue;
      topEvents.push(event);
      addedIds.add(event.id);
    }

    if (topEvents.length === 0) {
      await supabaseClient.from('chat_messages').insert({
        group_id: 'tribe_community_board', sender: 'MIA',
        text: '🌅 Heute keine Top Events gefunden – perfekt um selbst was zu planen! #topevents',
        avatar: MIA_AVATAR, read_by: [],
      });
      return new Response(JSON.stringify({ success: true, message: 'No events' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateFormatted = today.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

    // Build structured event data for the frontend to render as cards
    const top3 = topEvents.slice(0, 3);
    const eventCards = top3.map(e => ({
      id: e.id,
      title: cleanTitle(e.title),
      time: e.time ? String(e.time).substring(0, 5) : null,
      location: e.location || null,
      category: e.category,
      image: getEventImage(e),
      likes: e.likes || 0,
    }));

    // The text contains a JSON block that the frontend will parse and render as cards
    const messageText = `🌅 Tageshighlights – ${dateFormatted}\n\n<!--topevents:${JSON.stringify(eventCards)}-->\n\n#topevents`;

    const { error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        group_id: 'tribe_community_board',
        sender: 'MIA',
        text: messageText,
        avatar: MIA_AVATAR,
        media_url: null,
        read_by: [],
      });

    if (messageError) throw messageError;

    return new Response(JSON.stringify({
      success: true,
      events: eventCards,
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
