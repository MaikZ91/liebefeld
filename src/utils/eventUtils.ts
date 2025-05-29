import { Event, GitHubEvent } from '../types/eventTypes';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

// Transform GitHub events to our Event format
export const transformGitHubEvents = (
  githubEvents: GitHubEvent[], 
  eventLikes: Record<string, any> = {},
  currentYear: number = new Date().getFullYear()
): Event[] => {
  return githubEvents.map((githubEvent) => {
    const eventId = `github-${githubEvent.hash}`;
    const likesData = eventLikes[eventId] || {};
    
    // Extract category from the GitHub event data
    // Look for category in various possible fields
    let category = 'Sonstiges'; // Default fallback
    
    // Check if category is directly provided
    if (githubEvent.category) {
      category = githubEvent.category;
    }
    // Check if there's a genre field (some events use this)
    else if (githubEvent.genre) {
      category = githubEvent.genre;
    }
    // Check if there's a type field
    else if (githubEvent.type) {
      category = githubEvent.type;
    }
    // Try to infer category from event name/description
    else {
      const eventText = (githubEvent.event + ' ' + (githubEvent.description || '')).toLowerCase();
      
      if (eventText.includes('konzert') || eventText.includes('concert') || eventText.includes('musik') || eventText.includes('band')) {
        category = 'Konzert';
      } else if (eventText.includes('party') || eventText.includes('club') || eventText.includes('dj')) {
        category = 'Party';
      } else if (eventText.includes('festival')) {
        category = 'Festival';
      } else if (eventText.includes('ausstellung') || eventText.includes('exhibition') || eventText.includes('kunst')) {
        category = 'Ausstellung';
      } else if (eventText.includes('sport') || eventText.includes('fitness') || eventText.includes('lauf')) {
        category = 'Sport';
      } else if (eventText.includes('workshop') || eventText.includes('kurs')) {
        category = 'Workshop';
      } else if (eventText.includes('theater') || eventText.includes('schauspiel')) {
        category = 'Theater';
      } else if (eventText.includes('kino') || eventText.includes('film')) {
        category = 'Kino';
      } else if (eventText.includes('lesung') || eventText.includes('literatur')) {
        category = 'Lesung';
      }
    }

    console.log(`GitHub event ${githubEvent.event}: extracted category "${category}"`);
    
    return {
      id: eventId,
      title: githubEvent.event,
      description: githubEvent.description || '',
      date: githubEvent.date,
      time: githubEvent.time || '00:00',
      location: githubEvent.location || '',
      organizer: githubEvent.organizer || 'Unbekannt',
      category: category, // Use the extracted/inferred category
      likes: likesData.likes || 0,
      rsvp: {
        yes: likesData.rsvp_yes || 0,
        no: likesData.rsvp_no || 0,
        maybe: likesData.rsvp_maybe || 0
      },
      link: githubEvent.link || null,
      image_urls: githubEvent.image_urls || null
    };
  });
};

// Function to group events by date
export const groupEventsByDate = (events: Event[]): { [key: string]: Event[] } => {
  return events.reduce((groups: { [key: string]: Event[] }, event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});
};

// Function to sort events by date
export const sortEventsByDate = (events: Event[]): Event[] => {
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Function to get the start and end of the week
export const getWeekRange = (currentDate: Date): [Date, Date] => {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Assuming Monday is the first day of the week
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  return [start, end];
};

// Function to format a date range
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const startFormatted = format(startDate, 'd. MMMM', { locale: de });
  const endFormatted = format(endDate, 'd. MMMM', { locale: de });
  return `${startFormatted} - ${endFormatted}`;
};

export const getEventsForDay = (events: Event[], selectedDate: Date | null, filter: string | null = null): Event[] => {
  if (!selectedDate) return [];
  
  const targetDate = format(selectedDate, 'yyyy-MM-dd');
  console.log(`Getting events for date: ${targetDate}`);
  
  let filteredEvents = events.filter(event => {
    const eventMatches = event.date === targetDate;
    console.log(`Event ${event.title} (${event.date}) matches ${targetDate}: ${eventMatches}`);
    return eventMatches;
  });
  
  if (filter) {
    filteredEvents = filteredEvents.filter(event => event.category === filter);
  }
  
  console.log(`Found ${filteredEvents.length} events for ${targetDate}${filter ? ` with filter ${filter}` : ''}`);
  return filteredEvents;
};

export const getMonthOrFavoriteEvents = (events: Event[], currentDate: Date, showFavorites: boolean = false, eventLikes: Record<string, number> = {}): Event[] => {
  if (showFavorites) {
    return events.filter(event => (event.likes || 0) > 0);
  }
  
  const monthStart = format(startOfWeek(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfWeek(addDays(currentDate, 30)), 'yyyy-MM-dd');
  
  return events.filter(event => {
    return event.date >= monthStart && event.date <= monthEnd;
  });
};

export const groupFutureEventsByDate = (events: Event[]): Record<string, Event[]> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return events
    .filter(event => event.date >= today)
    .reduce((groups: Record<string, Event[]>, event) => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
      return groups;
    }, {});
};

export const formatEventDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Heute';
    }
    
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};
