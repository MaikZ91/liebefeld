import { Event, GitHubEvent } from '../types/eventTypes';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

// Transform GitHub events to our Event format
export const transformGitHubEvents = (
  githubEvents: GitHubEvent[], 
  eventLikes: Record<string, any> = {},
  currentYear: number = new Date().getFullYear()
): Event[] => {
  console.log(`[transformGitHubEvents] Processing ${githubEvents.length} GitHub events`);
  
  return githubEvents.map((githubEvent, index) => {
    console.log(`[transformGitHubEvents] Processing event ${index}:`, githubEvent);
    
    const eventId = `github-${githubEvent.hash || githubEvent.event || index}`;
    const likesData = eventLikes[eventId] || {};
    
    // Extract location and clean title from event name
    let title = githubEvent.event || 'Unnamed Event';
    let location = githubEvent.location || '';
    
    // Check if the title contains location in format "Event Name (@Location)"
    const locationMatch = title.match(/^(.+?)\s*\(@([^)]+)\)$/);
    if (locationMatch) {
      title = locationMatch[1].trim(); // Extract the event name without location
      location = locationMatch[2].trim(); // Extract the location from parentheses
      console.log(`[transformGitHubEvents] Extracted title: "${title}" and location: "${location}"`);
    }
    
    // Extract category from the GitHub event data
    let category = 'Sonstiges'; // Default fallback
    
    // Check if category is directly provided in the GitHub event
    if (githubEvent.category) {
      category = githubEvent.category;
      console.log(`[transformGitHubEvents] Found direct category: ${category}`);
    }
    // Check if there's a genre field (some events use this)
    else if (githubEvent.genre) {
      category = githubEvent.genre;
      console.log(`[transformGitHubEvents] Found genre category: ${category}`);
    }
    // Check if there's a type field
    else if (githubEvent.type) {
      category = githubEvent.type;
      console.log(`[transformGitHubEvents] Found type category: ${category}`);
    }
    // Try to infer category from event name/description
    else {
      const eventText = (title + ' ' + (githubEvent.description || '')).toLowerCase();
      
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
      
      console.log(`[transformGitHubEvents] Inferred category from text: ${category}`);
    }

    // Parse the date - handle different formats
    let eventDate = '';
    try {
      // Handle formats like "Thu, 29.05.2025" or "Th, 29.05"
      const dateStr = githubEvent.date;
      console.log(`[transformGitHubEvents] Original date string: ${dateStr}`);
      
      if (dateStr.includes('.')) {
        // Extract day and month from formats like "Thu, 29.05.2025" or "Th, 29.05"
        const dateMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3] || currentYear.toString();
          eventDate = `${year}-${month}-${day}`;
          console.log(`[transformGitHubEvents] Parsed date: ${eventDate}`);
        }
      }
      
      if (!eventDate) {
        console.warn(`[transformGitHubEvents] Could not parse date: ${dateStr}, using today`);
        eventDate = format(new Date(), 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error(`[transformGitHubEvents] Error parsing date for event ${title}:`, error);
      eventDate = format(new Date(), 'yyyy-MM-dd');
    }

    const transformedEvent: Event = {
      id: eventId,
      title: title,
      description: githubEvent.description || '',
      date: eventDate,
      time: githubEvent.time || '00:00',
      location: location,
      organizer: githubEvent.organizer || 'Unbekannt',
      category: category,
      likes: likesData.likes || 0,
      rsvp: {
        yes: likesData.rsvp_yes || 0,
        no: likesData.rsvp_no || 0,
        maybe: likesData.rsvp_maybe || 0
      },
      link: githubEvent.link || null,
      image_url: githubEvent.image_url || null // Use single image_url
    };
    
    console.log(`[transformGitHubEvents] Transformed event:`, transformedEvent);
    return transformedEvent;
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

// Add missing functions that are used in other components
export const getFutureEvents = (events: Event[]): Event[] => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const hasEventsOnDay = (events: Event[], day: Date): boolean => {
  const targetDate = format(day, 'yyyy-MM-dd');
  return events.some(event => event.date === targetDate);
};

export const getEventCountForDay = (events: Event[], day: Date): number => {
  const targetDate = format(day, 'yyyy-MM-dd');
  return events.filter(event => event.date === targetDate).length;
};
