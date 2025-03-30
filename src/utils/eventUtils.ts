import { Event, GitHubEvent } from '../types/eventTypes';
import { format, parseISO, isSameDay, isValid } from 'date-fns';

// Group events by their date for display in the calendar
export const groupEventsByDate = (events: Event[]): Record<string, Event[]> => {
  console.log(`groupEventsByDate: Grouping ${events.length} events`);
  const eventsByDate: Record<string, Event[]> = {};
  
  // If no events, return empty object
  if (!events || events.length === 0) {
    return {};
  }
  
  events.forEach(event => {
    try {
      // Skip events without a date
      if (!event.date) {
        console.warn(`Event has no date: ${event.title}`);
        return;
      }
      
      // Handle string dates and normalize the format
      let dateStr: string;
      try {
        // Try to parse and reformat the date
        const eventDate = parseISO(event.date);
        
        // Skip if the date is invalid
        if (!isValid(eventDate)) {
          console.warn(`Invalid date format in event: ${event.title}, date: ${event.date}`);
          return;
        }
        
        // Format to consistent string format for grouping
        dateStr = format(eventDate, 'yyyy-MM-dd');
      } catch (error) {
        console.error(`Error parsing event date: ${event.date} for event ${event.title}`, error);
        return; // Skip this event
      }
      
      // Initialize the date group if it doesn't exist
      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      
      // Add the event to its date group
      eventsByDate[dateStr].push(event);
    } catch (error) {
      console.error(`Error processing event: ${event.title}`, error);
    }
  });
  
  // Sort events within each date group by time
  Object.keys(eventsByDate).forEach(dateStr => {
    eventsByDate[dateStr].sort((a, b) => {
      // If both events have times, compare them
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      // If only one event has a time, prioritize it
      if (a.time) return -1;
      if (b.time) return 1;
      // If neither has a time, sort by title
      return a.title.localeCompare(b.title);
    });
    
    console.log(`Date ${dateStr} has ${eventsByDate[dateStr].length} events`);
  });
  
  console.log(`groupEventsByDate: Created ${Object.keys(eventsByDate).length} date groups`);
  return eventsByDate;
};

// Get events for a specific day
export const getEventsForDay = (events: Event[], day: Date, categoryFilter: string | null = null): Event[] => {
  return events.filter(event => {
    try {
      // Skip events without dates
      if (!event.date) return false;
      
      // Parse the date, skip if invalid
      let eventDate;
      try {
        eventDate = parseISO(event.date);
        if (!isValid(eventDate)) {
          console.warn(`Invalid date in event: ${event.title}, date: ${event.date}`);
          return false;
        }
      } catch (error) {
        console.error(`Failed to parse date for event: ${event.title}, date: ${event.date}`, error);
        return false;
      }
      
      // Check if the event is on the specified day
      const isSameDate = isSameDay(eventDate, day);
      
      // Apply category filter if provided
      const matchesCategory = !categoryFilter || event.category === categoryFilter;
      
      return isSameDate && matchesCategory;
    } catch (error) {
      console.error(`Error filtering event for day: ${event.title}`, error);
      return false;
    }
  });
};

// Get events for current month or filtered by favorites
export const getMonthOrFavoriteEvents = (
  events: Event[], 
  currentDate: Date, 
  showFavorites: boolean, 
  eventLikes: Record<string, number>
): Event[] => {
  if (showFavorites) {
    // Show favorites based on likes count
    return events.filter(event => (event.likes || 0) > 0);
  }
  
  // Otherwise show all events - don't filter by month to ensure we see recurring events
  return events;
};

// Transform GitHub events to our app's format
export const transformGitHubEvents = (
  githubEvents: GitHubEvent[], 
  eventLikes: Record<string, number>,
  year: number
): Event[] => {
  if (!githubEvents || !Array.isArray(githubEvents)) {
    console.error('Invalid GitHub events data:', githubEvents);
    return [];
  }

  try {
    console.log(`Transforming ${githubEvents.length} GitHub events`);
    
    const transformedEvents: Event[] = githubEvents.map(ghEvent => {
      // Generate a consistent ID for the GitHub event
      const eventId = `github-${ghEvent.id || Math.random().toString(36).substring(2, 9)}`;
      
      // Format the date properly - GitHub events often have just month and day
      let formattedDate = ghEvent.date || '';
      
      // If the date doesn't include a year, add the current year
      if (formattedDate && !formattedDate.includes('-')) {
        // Handle formats like "14.03" or "14.3."
        const dateMatch = formattedDate.match(/(\d{1,2})\.(\d{1,2})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }
      
      // Get likes from the likes map if available
      const likes = eventId in eventLikes ? eventLikes[eventId] : 0;
      
      return {
        id: eventId,
        title: ghEvent.title || 'Unnamed Event',
        description: ghEvent.description || '',
        date: formattedDate,
        time: ghEvent.time || '19:00',
        location: ghEvent.location || 'Bielefeld',
        organizer: ghEvent.organizer || '',
        category: ghEvent.category || 'Sonstiges',
        link: ghEvent.link || '',
        likes: likes,
        // Add empty RSVP counts if not available
        rsvp_yes: 0,
        rsvp_no: 0,
        rsvp_maybe: 0
      };
    });
    
    console.log(`Transformed ${transformedEvents.length} GitHub events`);
    return transformedEvents;
  } catch (error) {
    console.error('Error transforming GitHub events:', error);
    return [];
  }
};
