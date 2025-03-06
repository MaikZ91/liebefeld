
import { Event, GitHubEvent } from '../types/eventTypes';
import { parseAndNormalizeDate, debugDate } from './dateUtils';
import { format, isSameDay, isSameMonth, startOfDay } from 'date-fns';

// Determine event category based on keywords in title
export const determineEventCategory = (title: string): string => {
  if (title.includes("konzert") || title.includes("festival") || title.includes("musik") || 
      title.includes("band") || title.includes("jazz") || title.includes("chor")) {
    return "Konzert";
  } else if (title.includes("party") || title.includes("feier") || title.includes("disco") || 
             title.includes("club") || title.includes("tanz")) {
    return "Party";
  } else if (title.includes("ausstellung") || title.includes("galerie") || title.includes("kunst") || 
             title.includes("museum") || title.includes("vernissage")) {
    return "Ausstellung";
  } else if (title.includes("sport") || title.includes("fußball") || title.includes("lauf") || 
             title.includes("turnier") || title.includes("fitness")) {
    return "Sport";
  } else if (title.includes("workshop") || title.includes("kurs")) {
    return "Workshop";
  } else if (title.includes("theater") || title.includes("film") || title.includes("kino")) {
    return "Kultur";
  } else {
    return "Sonstiges";
  }
};

// Get events for a specific day
export const getEventsForDay = (events: Event[], day: Date, filter: string | null = null): Event[] => {
  console.log(`Checking events for day: ${day.toISOString()}`);
  
  const result = events.filter(event => {
    try {
      if (!event.date) return false;
      const eventDate = parseAndNormalizeDate(event.date);
      const normalizedDay = startOfDay(day);
      
      // For debugging
      debugDate(eventDate, `Event date for ${event.title}`);
      debugDate(normalizedDay, "Target day");
      
      // Check if dates are the same day
      const sameDay = isSameDay(eventDate, normalizedDay);
      console.log(`${event.title}: Same day? ${sameDay ? 'YES' : 'NO'}`);
      
      // Apply category filter if present
      return filter ? (sameDay && event.category === filter) : sameDay;
    } catch (error) {
      console.error(`Error filtering events for day ${day.toISOString()}:`, error);
      return false;
    }
  });
  
  console.log(`Found ${result.length} events for ${day.toISOString()}`);
  return result;
};

// Check if a day has events
export const hasEventsOnDay = (events: Event[], day: Date): boolean => {
  return events.some(event => {
    try {
      if (!event.date) return false;
      const eventDate = parseAndNormalizeDate(event.date);
      return isSameDay(eventDate, day);
    } catch (error) {
      console.error(`Error in hasEvents for day ${day.toISOString()}:`, error);
      return false;
    }
  });
};

// Count events for a specific day
export const getEventCountForDay = (events: Event[], day: Date): number => {
  return getEventsForDay(events, day).length;
};

// Get all events for the current month or favorites
export const getMonthOrFavoriteEvents = (
  events: Event[], 
  currentDate: Date, 
  showFavorites: boolean, 
  eventLikes: Record<string, number>
): Event[] => {
  return events
    .filter(event => {
      try {
        // If viewing favorites, only show favorites regardless of month
        if (showFavorites) {
          // For GitHub events
          if (event.id.startsWith('github-')) {
            return eventLikes[event.id] && eventLikes[event.id] > 0;
          }
          // For regular events
          return event.likes && event.likes > 0;
        }
        
        // Check if the event date is valid
        if (!event.date) return false;
        const eventDate = parseAndNormalizeDate(event.date);
        if (isNaN(eventDate.getTime())) return false;
        
        // Otherwise filter by current month
        return isSameMonth(eventDate, currentDate);
      } catch (error) {
        console.error(`Error filtering events for month:`, error);
        return false;
      }
    })
    .sort((a, b) => {
      // First sort by likes (descending)
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      
      if (likesA !== likesB) {
        return likesB - likesA;
      }
      
      // Then by date (ascending)
      try {
        const dateA = parseAndNormalizeDate(a.date);
        const dateB = parseAndNormalizeDate(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error(`Error sorting events by date:`, error);
        return 0;
      }
    });
};

// Group events by date for list view
export const groupEventsByDate = (events: Event[]): Record<string, Event[]> => {
  return events.reduce((acc, event) => {
    try {
      const dateStr = event.date;
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(event);
    } catch (error) {
      console.error(`Error grouping events by date:`, error);
    }
    return acc;
  }, {} as Record<string, Event[]>);
};

// Transform GitHub events to our format
export const transformGitHubEvents = (
  githubEvents: GitHubEvent[], 
  eventLikes: Record<string, number>,
  currentYear: number
): Event[] => {
  console.log(`Transforming ${githubEvents.length} GitHub events, current year: ${currentYear}`);
  
  return githubEvents.map((githubEvent, index) => {
    // Extract location from event title (if available)
    let title = githubEvent.event;
    let location = "Bielefeld";
    let category = determineEventCategory(githubEvent.event.toLowerCase());
    
    // Check if there's a location in parentheses
    const locationMatch = githubEvent.event.match(/\(@([^)]+)\)/);
    if (locationMatch) {
      // Remove the location from the title
      title = githubEvent.event.replace(/\s*\(@[^)]+\)/, '');
      location = locationMatch[1];
    }
    
    // Parse the date (Format: "Fri, 04.04" or similar)
    let eventDate;
    try {
      // Log the original date string
      console.log(`Parsing date: ${githubEvent.date} for event: ${title}`);
      
      // Extract the day of week and date part
      const dateParts = githubEvent.date.split(', ');
      if (dateParts.length < 2) {
        throw new Error(`Invalid date format: ${githubEvent.date}`);
      }
      
      const dateNumbers = dateParts[1].split('.'); // e.g., ["04", "04"]
      if (dateNumbers.length < 2) {
        throw new Error(`Invalid date format: ${dateParts[1]}`);
      }
      
      // Parse day and month numbers
      const day = parseInt(dateNumbers[0], 10);
      const month = parseInt(dateNumbers[1], 10) - 1; // JavaScript months are 0-indexed
      
      // Create date with current year
      const now = new Date();
      eventDate = new Date(Date.UTC(currentYear, month, day));
      
      // For debugging
      console.log(`Parsed date: ${eventDate.toISOString()} (${day}.${month+1}.${currentYear})`);
      
      // If the date is in the past, check if it's likely for next year
      // (this handles events listed for later in the year when we're in early months)
      if (eventDate < now && month < 6) { // Only for first half of the year
        eventDate.setFullYear(currentYear + 1);
        console.log(`Date adjusted to next year: ${eventDate.toISOString()}`);
      }
    } catch (err) {
      console.warn(`Konnte Datum nicht parsen: ${githubEvent.date}`, err);
      // Fallback to today's date
      eventDate = new Date();
    }
    
    const eventId = `github-${index}`;
    const likesCount = eventLikes[eventId] || 0;
    
    const formattedDate = format(eventDate, 'yyyy-MM-dd');
    console.log(`Event ${title} formatted date: ${formattedDate}`);
    
    // Create and return the event object
    return {
      id: eventId,
      title: title,
      description: `Mehr Informationen unter: ${githubEvent.link}`,
      date: formattedDate,
      time: "19:00", // Default time for events without time
      location: location,
      organizer: "Liebefeld Community Bielefeld",
      category: category,
      likes: likesCount,
      link: githubEvent.link
    } as Event;
  });
};
