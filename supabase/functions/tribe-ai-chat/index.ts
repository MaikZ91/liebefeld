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
      // INTELLIGENT EVENT LOADING: Parse user message to determine date range
      let dateFilter = { start: '', end: '' };
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Extract date references from user message
      const lowerMessage = message.toLowerCase();
      
      // Check for specific date patterns
      const datePatterns = [
        /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/g, // DD.MM or DD.MM.YYYY
        /(\d{1,2})\s+(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/gi,
        /nach\s+dem\s+(\d{1,2})\.(\d{1,2})/gi,
        /ab\s+(\d{1,2})\.(\d{1,2})/gi,
      ];
      
      let parsedDate: Date | null = null;
      
      // Check for "nach dem DD.MM" or "ab DD.MM" patterns
      const afterPattern = /(?:nach\s+dem|ab)\s+(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/i;
      const afterMatch = message.match(afterPattern);
      if (afterMatch) {
        const day = parseInt(afterMatch[1]);
        const month = parseInt(afterMatch[2]) - 1;
        const year = afterMatch[3] ? (afterMatch[3].length === 2 ? 2000 + parseInt(afterMatch[3]) : parseInt(afterMatch[3])) : today.getFullYear();
        parsedDate = new Date(year, month, day);
        console.log('[tribe-ai-chat] Detected date pattern "nach dem/ab":', parsedDate.toISOString());
      }
      
      // Check for specific date DD.MM.YYYY
      if (!parsedDate) {
        const specificDatePattern = /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/;
        const dateMatch = message.match(specificDatePattern);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]) - 1;
          const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : today.getFullYear();
          parsedDate = new Date(year, month, day);
          console.log('[tribe-ai-chat] Detected specific date:', parsedDate.toISOString());
        }
      }
      
      // Date keywords
      if (lowerMessage.includes('heute') || lowerMessage.includes('today')) {
        dateFilter.start = todayStr;
        dateFilter.end = todayStr;
      } else if (lowerMessage.includes('morgen') || lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter.start = tomorrow.toISOString().split('T')[0];
        dateFilter.end = dateFilter.start;
      } else if (lowerMessage.includes('wochenende') || lowerMessage.includes('weekend')) {
        // Find next Saturday
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        dateFilter.start = saturday.toISOString().split('T')[0];
        dateFilter.end = sunday.toISOString().split('T')[0];
      } else if (lowerMessage.includes('diese woche') || lowerMessage.includes('this week')) {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        dateFilter.start = todayStr;
        dateFilter.end = endOfWeek.toISOString().split('T')[0];
      } else if (lowerMessage.includes('nächste woche') || lowerMessage.includes('next week')) {
        const startOfNextWeek = new Date(today);
        startOfNextWeek.setDate(today.getDate() + (8 - today.getDay()));
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
        dateFilter.start = startOfNextWeek.toISOString().split('T')[0];
        dateFilter.end = endOfNextWeek.toISOString().split('T')[0];
      } else if (parsedDate) {
        // Use parsed date - load 7 days from that date
        dateFilter.start = parsedDate.toISOString().split('T')[0];
        const endDate = new Date(parsedDate);
        endDate.setDate(parsedDate.getDate() + 7);
        dateFilter.end = endDate.toISOString().split('T')[0];
      } else {
        // Default: next 14 days
        const twoWeeks = new Date(today);
        twoWeeks.setDate(today.getDate() + 14);
        dateFilter.start = todayStr;
        dateFilter.end = twoWeeks.toISOString().split('T')[0];
      }
      
      console.log('[tribe-ai-chat] Loading events from DB for date range:', dateFilter.start, 'to', dateFilter.end);
      
      // FETCH EVENTS DIRECTLY FROM DATABASE
      let dbEvents: any[] = [];
      try {
        const query = supabase
          .from('community_events')
          .select('*')
          .gte('date', dateFilter.start)
          .lte('date', dateFilter.end)
          .order('date', { ascending: true })
          .order('likes', { ascending: false })
          .limit(50);
        
        if (city) {
          query.eq('city', city);
        }
        
        const { data: eventData, error: eventError } = await query;
        
        if (!eventError && eventData) {
          dbEvents = eventData.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            date: e.date,
            time: e.time,
            location: e.location,
            city: e.city,
            description: e.description?.substring(0, 200),
            likes: e.likes || 0,
            image_url: e.image_url
          }));
          console.log('[tribe-ai-chat] Loaded', dbEvents.length, 'events from DB');
        }
      } catch (e) {
        console.error('Error fetching events from DB:', e);
      }
      
      // Merge DB events with client-passed events (client events may have match scores)
      const clientEvents = events || [];
      const mergedEventsMap = new Map();
      
      // Add DB events first
      dbEvents.forEach(e => mergedEventsMap.set(e.id, e));
      
      // Overlay client events (which may have matchScore)
      clientEvents.forEach((e: any) => {
        const existing = mergedEventsMap.get(e.id);
        if (existing) {
          mergedEventsMap.set(e.id, { ...existing, matchScore: e.matchScore });
        } else {
          mergedEventsMap.set(e.id, e);
        }
      });
      
      const finalEvents = Array.from(mergedEventsMap.values())
        .sort((a, b) => {
          // Sort by match score first, then by likes
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return (b.likes || 0) - (a.likes || 0);
        })
        .slice(0, 40);

      // Fetch community meetups from chat_messages
      let communityMeetups: any[] = [];
      try {
        const { data: meetupMessages, error: meetupError } = await supabase
          .from('chat_messages')
          .select('*')
          .or('text.ilike.%meetup%,text.ilike.%treffen%,text.ilike.%wer hat lust%,text.ilike.%wer kommt%,text.ilike.%bin dabei%')
          .gte('created_at', `${todayStr}T00:00:00`)
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
      const eventContext = finalEvents.length > 0 
        ? `\n\n📅 VERFÜGBARE EVENTS (${dateFilter.start} bis ${dateFilter.end}, sortiert nach Relevanz):\n${finalEvents.map((e: any, idx: number) => 
            `${idx + 1}. "${e.title}" (${e.category}) am ${e.date} um ${e.time || 'TBA'} in ${e.location || e.city}${e.likes ? ` - ❤️ ${e.likes} Likes` : ''}${e.matchScore ? ` - 🎯 ${e.matchScore}% Match` : ''}`
          ).join('\n')}`
        : `\n\n⚠️ KEINE EVENTS gefunden für den Zeitraum ${dateFilter.start} bis ${dateFilter.end} in ${city || 'der ausgewählten Stadt'}. Schlage dem Nutzer vor, einen anderen Zeitraum oder andere Stadt zu probieren.`;

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
9. Wenn keine Events gefunden wurden, erkläre das freundlich und schlage Alternativen vor

Stadt/Region: ${city || 'Bielefeld'}
Angefragter Zeitraum: ${dateFilter.start} bis ${dateFilter.end}
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

    // Extract related events - use finalEvents if available
    const searchEvents = events || [];
    const relatedEvents = searchEvents.filter((e: any) => 
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
