
import { Event } from '@/types/eventTypes';
import { format, parseISO } from 'date-fns';

// Group events by their date
export const groupEventsByDate = (events: Event[]): Record<string, Event[]> => {
  const eventsByDate: Record<string, Event[]> = {};

  events.forEach(event => {
    try {
      // Only process events that have a valid date
      if (event.date) {
        // Format the date key consistently
        const formattedDate = format(
          typeof event.date === 'string' ? parseISO(event.date) : event.date,
          'yyyy-MM-dd'
        );

        if (!eventsByDate[formattedDate]) {
          eventsByDate[formattedDate] = [];
        }
        
        eventsByDate[formattedDate].push(event);
      }
    } catch (error) {
      console.error('Error processing event date:', error, event);
    }
  });

  // Sort dates chronologically
  return Object.fromEntries(
    Object.entries(eventsByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
  );
};

// Transform GitHub events to our Event format
export const transformGitHubEvents = (
  githubEvents: { date: string; event: string; link: string }[],
  eventLikes: Record<string, any>,
  currentYear: number
): Event[] => {
  return githubEvents.map(ghEvent => {
    // Create a unique ID for the GitHub event
    const id = `github-${Buffer.from(ghEvent.event).toString('base64').replace(/=/g, '')}`;
    
    // Parse the event date
    const dateMatch = ghEvent.date.match(/(\d{2})\.(\d{2})/);
    let eventDate = '';
    
    if (dateMatch) {
      const day = dateMatch[1];
      const month = dateMatch[2]; 
      eventDate = `${currentYear}-${month}-${day}`;
    } else {
      console.error('Could not parse date:', ghEvent.date);
      eventDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    // Get likes and RSVP data from the database, if available
    const eventData = eventLikes[id] || {};
    
    return {
      id,
      title: ghEvent.event,
      description: ghEvent.event,
      date: eventDate,
      time: '19:00', // Default time if not specified
      location: 'Bielefeld',
      category: identifyEventCategory(ghEvent.event),
      organizer: 'GitHub Event',
      link: ghEvent.link,
      likes: eventData.likes || 0,
      rsvp_yes: eventData.rsvp_yes || 0,
      rsvp_no: eventData.rsvp_no || 0,
      rsvp_maybe: eventData.rsvp_maybe || 0,
      origin: 'github' as 'github',
    };
  });
};

// Function to check if an event is a Tribe event
export const isTribeEvent = (title: string): boolean => {
  const tribeKeywords = ['tribe', 'tuesday run', 'kennenlernabend', 'creatives circle'];
  return tribeKeywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Helper function to identify event category based on its title
const identifyEventCategory = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('konzert') || lowerTitle.includes('music') || lowerTitle.includes('band')) {
    return 'Konzert';
  }
  
  if (lowerTitle.includes('party') || lowerTitle.includes('club') || lowerTitle.includes('dj')) {
    return 'Party';
  }
  
  if (lowerTitle.includes('ausstellung') || lowerTitle.includes('exhibition') || lowerTitle.includes('gallery')) {
    return 'Ausstellung';
  }
  
  if (lowerTitle.includes('sport') || lowerTitle.includes('yoga') || lowerTitle.includes('lauf') || 
      lowerTitle.includes('run') || lowerTitle.includes('training')) {
    return 'Sport';
  }
  
  if (lowerTitle.includes('workshop') || lowerTitle.includes('seminar') || lowerTitle.includes('kurs')) {
    return 'Workshop';
  }
  
  if (lowerTitle.includes('theater') || lowerTitle.includes('film') || lowerTitle.includes('kino') || 
      lowerTitle.includes('cinema') || lowerTitle.includes('culture')) {
    return 'Kultur';
  }
  
  if (lowerTitle.includes('meet') || lowerTitle.includes('treffen') || lowerTitle.includes('network')) {
    return 'Networking';
  }
  
  // Default category if no match
  return 'Sonstiges';
};
