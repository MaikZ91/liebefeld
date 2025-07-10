import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  category: string;
  likes: number;
  liked_by_users: Array<{
    username: string;
    avatar_url?: string;
    timestamp: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🌅 [Daily Top Event] Starting daily top event message generation...');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`🗓️ [Daily Top Event] Looking for events on ${today}`);

    // Find today's events with the highest likes
    const { data: events, error: eventsError } = await supabaseClient
      .from('community_events')
      .select('*')
      .eq('date', today)
      .gte('likes', 1) // Only events with at least 1 like
      .order('likes', { ascending: false })
      .limit(1);

    if (eventsError) {
      console.error('❌ [Daily Top Event] Error fetching events:', eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log('📭 [Daily Top Event] No events with likes found for today');
      
      // Post a message that there are no top events today
      const noEventMessage = `🌅 **Guten Morgen, Bielefeld!** 

Heute scheint ein ruhiger Tag zu sein - ich habe kein besonders beliebtes Event für heute gefunden. 

Perfekt, um selbst etwas zu planen oder einfach zu entspannen! ✨

Habt einen wunderschönen Tag! 💙

_- MIA, eure Event-Assistentin_`;

      await supabaseClient
        .from('chat_messages')
        .insert({
          group_id: 'ausgehen-bielefeld',
          sender: 'MIA - Event Assistentin',
          text: noEventMessage,
          avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
          created_at: new Date().toISOString()
        });

      return new Response(JSON.stringify({ success: true, message: 'No top events today message sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const topEvent = events[0] as Event;
    console.log(`🏆 [Daily Top Event] Top event found: ${topEvent.title} with ${topEvent.likes} likes`);

    // Get the users who liked this event
    const likedByUsers = Array.isArray(topEvent.liked_by_users) ? topEvent.liked_by_users : [];
    console.log(`👥 [Daily Top Event] Liked by ${likedByUsers.length} users`);

    // Format the time nicely
    const formatTime = (timeString: string) => {
      if (!timeString || timeString === '00:00') return '';
      const [hours, minutes] = timeString.split(':');
      return ` um ${hours}:${minutes} Uhr`;
    };

    // Create the usernames list
    let usersText = '';
    if (likedByUsers.length > 0) {
      const usernames = likedByUsers.map(user => user.username || 'Anonym').slice(0, 5);
      if (likedByUsers.length <= 3) {
        usersText = `\n\n💙 **Interessiert sind:** ${usernames.join(', ')}`;
      } else if (likedByUsers.length <= 5) {
        usersText = `\n\n💙 **Interessiert sind:** ${usernames.join(', ')}`;
      } else {
        usersText = `\n\n💙 **Interessiert sind:** ${usernames.slice(0, 3).join(', ')} und ${likedByUsers.length - 3} weitere`;
      }
    }

    // Create the message
    const messageText = `🌅 **Guten Morgen, Bielefeld!** 

🏆 **Das Top Event von heute ist:**

**${topEvent.title}**${formatTime(topEvent.time)}
📍 ${topEvent.location || 'Ort wird noch bekannt gegeben'}
🏷️ ${topEvent.category}

${topEvent.description ? `${topEvent.description.substring(0, 200)}${topEvent.description.length > 200 ? '...' : ''}` : 'Ein spannendes Event wartet auf euch!'}

⭐ **${topEvent.likes} ${topEvent.likes === 1 ? 'Person ist' : 'Personen sind'} interessiert!**${usersText}

Habt einen fantastischen Tag! ✨

_- MIA, eure Event-Assistentin_`;

    // Post the message to the community chat
    const { error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        group_id: 'ausgehen-bielefeld', // Main community group
        sender: 'MIA - Event Assistentin',
        text: messageText,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        event_id: topEvent.id,
        event_title: topEvent.title,
        event_date: topEvent.date,
        event_location: topEvent.location,
        created_at: new Date().toISOString()
      });

    if (messageError) {
      console.error('❌ [Daily Top Event] Error posting message:', messageError);
      throw messageError;
    }

    console.log('✅ [Daily Top Event] Daily top event message posted successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Daily top event message sent',
      event: {
        title: topEvent.title,
        likes: topEvent.likes,
        interestedUsers: likedByUsers.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [Daily Top Event] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send daily top event message',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});