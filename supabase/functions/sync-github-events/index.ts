// supabase/functions/sync-github-events/index.ts
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
  city?: string;
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

    const now = new Date();
    const transformedEvents = [];

    for (const githubEvent of githubEvents) {
      // Clean title from special characters and extract location
      let title = githubEvent.event || 'Unnamed Event';
      let location = githubEvent.location || '';
      
      // Extract location from title if in format "Event Name (@Location)"
      const locationMatch = title.match(/^(.+?)\s*\(@([^)]+)\)$/);
      if (locationMatch) {
        title = locationMatch[1].trim();
        location = locationMatch[2].trim();
      }

      // Remove leading/trailing asterisks or other problematic characters from title
      title = title.replace(/^[\*\s]+|[\*\s]+$/g, '').trim();

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
        else if (eventText.includes('sport') || eventText.includes('fitness') || eventText.includes('laufen') || eventText.includes('training') || eventText.includes('yoga') || eventText.includes('tango')) category = 'Sport';
        else if (eventText.includes('workshop')) category = 'Workshop';
        else if (eventText.includes('theater')) category = 'Theater';
        else if (eventText.includes('kino') || eventText.includes('film')) category = 'Kino';
        else if (eventText.includes('lesung')) category = 'Lesung';
        else if (eventText.includes('quiz') || eventText.includes('kneipenquiz')) category = 'Ausgehen';
        else if (eventText.includes('foodsharing') || eventText.includes('cafe')) category = 'Ausgehen';
        else if (eventText.includes('kreatives schreiben') || eventText.includes('improv')) category = 'Kreativität';
        else if (eventText.includes('yoga')) category = 'Sport';
      }

      // Parse date - IMPROVED TO HANDLE WEEKDAY PREFIXES
      let eventDate = '';
      try {
        const dateStr = githubEvent.date;
        console.log(`[DATE PARSING] Original date string: "${dateStr}" for event "${title}"`);
        
        if (dateStr && dateStr.includes('.')) {
          // Updated regex to handle optional weekday prefixes like "Tu, " or "Mo, "
          const dateMatch = dateStr.match(/(?:\w+,\s*)?(\d{1,2})\.(\d{1,2})(?:\.(\d{4}|\d{2}))?/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            let year;

            // Determine the year. If a 2-digit year is provided, assume 21st century.
            // If no year is provided, default to current year.
            if (dateMatch[3]) { 
              let yearStr = dateMatch[3];
              if (yearStr.length === 2) {
                year = `20${yearStr}`;
              } else {
                year = yearStr;
              }
            } else { 
              // If no year is explicitly mentioned, assume it's for the current year or next closest year
              // This is a heuristic that might need further refinement for edge cases.
              const currentYear = now.getFullYear();
              const parsedMonth = parseInt(month, 10);
              const parsedDay = parseInt(day, 10);
              
              const testDateCurrentYear = new Date(currentYear, parsedMonth - 1, parsedDay);
              const testDateNextYear = new Date(currentYear + 1, parsedMonth - 1, parsedDay);

              if (testDateCurrentYear >= now) {
                year = currentYear.toString();
              } else {
                year = (currentYear + 1).toString(); // Assume it's for next year if current year's date already passed
              }
              console.log(`[DATE PARSING] No year found for "${title}". Inferring to ${year}.`);
            }
            eventDate = `${year}-${month}-${day}`;

            // --- WEEKDAY CORRECTION ---
            // If title starts with a weekday prefix like "MI •", "FR•", "SA •", etc.,
            // adjust the parsed date to the nearest matching weekday (within ±3 days).
            const weekdayPrefixes: Record<string, number> = {
              'MO': 1, 'DI': 2, 'MI': 3, 'DO': 4, 'FR': 5, 'SA': 6, 'SO': 0,
            };
            const prefixMatch = title.match(/^(MO|DI|MI|DO|FR|SA|SO)\s*[•·\-\s]/i);
            if (prefixMatch) {
              const expectedDay = weekdayPrefixes[prefixMatch[1].toUpperCase()];
              const parsed = new Date(eventDate + 'T12:00:00');
              const actualDay = parsed.getDay();
              if (expectedDay !== undefined && actualDay !== expectedDay) {
                // Find the offset to shift: try -3 to +3 days
                for (let offset = -3; offset <= 3; offset++) {
                  const candidate = new Date(parsed);
                  candidate.setDate(candidate.getDate() + offset);
                  if (candidate.getDay() === expectedDay) {
                    eventDate = candidate.toISOString().split('T')[0];
                    console.log(`[DATE CORRECTION] "${title}" date shifted by ${offset} days: ${year}-${month}-${day} -> ${eventDate}`);
                    break;
                  }
                }
              }
            }
            // --- END WEEKDAY CORRECTION ---

            console.log(`[DATE PARSING] Successfully parsed "${dateStr}" -> "${eventDate}" for event "${title}"`);
          } else {
            console.warn(`[DATE PARSING] Regex failed to match date string: "${dateStr}" for event "${title}"`);
          }
        }
        
        if (!eventDate) {
          console.warn(`[DATE PARSING] Could not parse date for "${title}" from string: "${dateStr}". Defaulting to today.`);
          eventDate = now.toISOString().split('T')[0]; // Fallback if parsing fails
        }
      } catch (error) {
        console.error(`[DATE PARSING] Error parsing date for ${title}:`, error);
        eventDate = new Date().toISOString().split('T')[0]; // Fallback on error
      }

      // Parse time
      let eventTime = githubEvent.time || '20:00';
      if (!eventTime.match(/^\d{2}:\d{2}$/)) {
        eventTime = '20:00';
      }

      // Generate a more robust external_id from cleaned title and parsed date/time
      const uniqueStringForId = `${title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')}_${eventDate}_${eventTime}_${location.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')}`;
      const externalId = githubEvent.hash || uniqueStringForId || `event-${transformedEvents.length}`;
      
      const existingData = existingEventsMap.get(externalId);

      const transformedEvent = {
        source: 'github',
        external_id: externalId,
        title: title,
        description: githubEvent.description || '',
        date: eventDate,
        time: eventTime,
        location: location,
        city: githubEvent.city || 'Bielefeld', // Default to Bielefeld if city is not provided
        organizer: githubEvent.organizer || 'Unbekannt', // Use organizer from source if available
        category: category,
        link: githubEvent.link || null,
        image_url: githubEvent.image_url || null,
        is_paid: false, // Assuming GitHub events are not paid unless explicitly stated
        likes: existingData ? existingData.likes : 0,
        rsvp_yes: existingData ? existingData.rsvp_yes : 0,
        rsvp_no: existingData ? existingData.rsvp_no : 0,
        rsvp_maybe: existingData ? existingData.rsvp_maybe : 0
      };

      console.log(`[Transformed Event Debug] Event: ${transformedEvent.title}, Date: ${transformedEvent.date}, Time: ${transformedEvent.time}, External ID: ${transformedEvent.external_id}, Category: ${transformedEvent.category}`);
      transformedEvents.push(transformedEvent);
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
          console.error(`Error upserting event ${event.title} (External ID: ${event.external_id}):`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Exception upserting event ${event.title} (External ID: ${event.external_id}):`, error);
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