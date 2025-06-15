
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubEvent {
  hash?: string;
  event: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  category?: string;
  genre?: string;
  type?: string;
  link?: string;
  image_url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Starting GitHub events synchronization...');

    // 1. Fetch existing GitHub-sourced events to preserve user-generated data
    const { data: existingEvents, error: existingEventsError } = await supabase
      .from('community_events')
      .select('external_id, likes, rsvp_yes, rsvp_no, rsvp_maybe')
      .eq('source', 'github');

    if (existingEventsError) {
      console.error('Error fetching existing events:', existingEventsError);
      throw new Error(`Failed to fetch existing events: ${existingEventsError.message}`);
    }

    const existingEventsMap = new Map();
    if (existingEvents) {
      for (const event of existingEvents) {
        if (event.external_id) {
          existingEventsMap.set(event.external_id, {
            likes: event.likes,
            rsvp_yes: event.rsvp_yes,
            rsvp_no: event.rsvp_no,
            rsvp_maybe: event.rsvp_maybe,
          });
        }
      }
    }
    console.log(`Found ${existingEventsMap.size} existing GitHub events with user data to preserve.`);


    // URL zur GitHub Events JSON Datei
    const EXTERNAL_EVENTS_URL = "https://raw.githubusercontent.com/MaikZ91/productiontools/master/events.json";
    const cacheBuster = `?t=${new Date().getTime()}`;
    
    const response = await fetch(`${EXTERNAL_EVENTS_URL}${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const githubEvents: GitHubEvent[] = await response.json();
    console.log(`Fetched ${githubEvents.length} GitHub events`);

    const currentYear = new Date().getFullYear();
    const transformedEvents = [];

    for (const githubEvent of githubEvents) {
      // Transform GitHub event to our format
      let title = githubEvent.event || 'Unnamed Event';
      let location = githubEvent.location || '';
      
      // Extract location from title if in format "Event Name (@Location)"
      const locationMatch = title.match(/^(.+?)\s*\(@([^)]+)\)$/);
      if (locationMatch) {
        title = locationMatch[1].trim();
        location = locationMatch[2].trim();
      }

      // Determine category
      let category = 'Sonstiges';
      if (githubEvent.category) {
        category = githubEvent.category;
      } else if (githubEvent.genre) {
        category = githubEvent.genre;
      } else if (githubEvent.type) {
        category = githubEvent.type;
      } else {
        // Infer from title/description
        const eventText = (title + ' ' + (githubEvent.description || '')).toLowerCase();
        if (eventText.includes('konzert') || eventText.includes('musik')) category = 'Konzert';
        else if (eventText.includes('party') || eventText.includes('club')) category = 'Party';
        else if (eventText.includes('festival')) category = 'Festival';
        else if (eventText.includes('ausstellung') || eventText.includes('kunst')) category = 'Ausstellung';
        else if (eventText.includes('sport') || eventText.includes('fitness')) category = 'Sport';
        else if (eventText.includes('workshop')) category = 'Workshop';
        else if (eventText.includes('theater')) category = 'Theater';
        else if (eventText.includes('kino') || eventText.includes('film')) category = 'Kino';
        else if (eventText.includes('lesung')) category = 'Lesung';
      }

      // Parse date
      let eventDate = '';
      try {
        const dateStr = githubEvent.date;
        if (dateStr && dateStr.includes('.')) {
          const dateMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3] || currentYear.toString();
            eventDate = `${year}-${month}-${day}`;
          }
        }
        
        if (!eventDate) {
          eventDate = new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn(`Error parsing date for ${title}:`, error);
        eventDate = new Date().toISOString().split('T')[0];
      }

      // Parse time
      let eventTime = githubEvent.time || '20:00';
      if (!eventTime.match(/^\d{2}:\d{2}$/)) {
        eventTime = '20:00';
      }

      const externalId = githubEvent.hash || githubEvent.event || `event-${transformedEvents.length}`;
      const existingData = existingEventsMap.get(externalId);

      transformedEvents.push({
        source: 'github',
        external_id: externalId,
        title: title,
        description: githubEvent.description || '',
        date: eventDate,
        time: eventTime,
        location: location,
        organizer: '',
        category: category,
        link: githubEvent.link || null,
        image_url: githubEvent.image_url || null,
        is_paid: false,
        likes: existingData ? existingData.likes : 0,
        rsvp_yes: existingData ? existingData.rsvp_yes : 0,
        rsvp_no: existingData ? existingData.rsvp_no : 0,
        rsvp_maybe: existingData ? existingData.rsvp_maybe : 0
      });
    }

    console.log(`Transformed ${transformedEvents.length} events, preserving user data.`);

    // Upsert events into community_events table
    let successCount = 0;
    let errorCount = 0;

    for (const event of transformedEvents) {
      try {
        const { error } = await supabase
          .from('community_events')
          .upsert(event, {
            onConflict: 'source,external_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error upserting event ${event.title}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Exception upserting event ${event.title}:`, error);
        errorCount++;
      }
    }

    console.log(`Sync completed: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronized ${successCount} GitHub events successfully`,
        errors: errorCount,
        total: transformedEvents.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in GitHub events sync:', error);
    
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
