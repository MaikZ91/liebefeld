
import { Event, GitHubEvent } from '../types/eventTypes';
import { parseAndNormalizeDate, debugDate } from './dateUtils';
import { format, isSameDay, isSameMonth, startOfDay, isAfter, isBefore, differenceInDays, parseISO, compareAsc } from 'date-fns';

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
  const today = startOfDay(new Date());
  
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
      try {
        const dateA = parseAndNormalizeDate(a.date);
        const dateB = parseAndNormalizeDate(b.date);
        
        // First group: today and future events (sorted by proximity to today)
        // Second group: past events (sorted by most recent first)
        const isABeforeToday = isBefore(dateA, today);
        const isBBeforeToday = isBefore(dateB, today);
        
        if (isABeforeToday && !isBBeforeToday) {
          return 1; // B comes first (it's not in the past)
        } else if (!isABeforeToday && isBBeforeToday) {
          return -1; // A comes first (it's not in the past)
        } else if (!isABeforeToday && !isBBeforeToday) {
          // Both are today or future, sort by proximity to today
          return differenceInDays(dateA, today) - differenceInDays(dateB, today);
        } else {
          // Both are past, sort by most recent first
          return dateB.getTime() - dateA.getTime();
        }
      } catch (error) {
        console.error(`Error sorting events by date:`, error);
        
        // If there's a likes difference, fall back to that
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        
        // If likes are equal, use id for stable sorting
        if (likesB === likesA) {
          return a.id.localeCompare(b.id);
        }
        
        return likesB - likesA;
      }
    });
};

// Group events by date for list view
export const groupEventsByDate = (events: Event[]): Record<string, Event[]> => {
  const groupedEvents = events.reduce((acc, event) => {
    try {
      const dateStr = event.date;
      if (!dateStr) return acc;
      
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(event);
    } catch (error) {
      console.error(`Error grouping events by date:`, error);
    }
    return acc;
  }, {} as Record<string, Event[]>);
  
  // No need to sort here as we'll do this in the component
  return groupedEvents;
};

// Get future events (starting from today) sorted by date
export const getFutureEvents = (events: Event[]): Event[] => {
  const today = startOfDay(new Date());
  
  return events
    .filter(event => {
      try {
        if (!event.date) return false;
        const eventDate = parseAndNormalizeDate(event.date);
        return isAfter(eventDate, today) || isSameDay(eventDate, today);
      } catch (error) {
        console.error(`Error filtering future events:`, error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return compareAsc(dateA, dateB);
      } catch (error) {
        console.error(`Error sorting future events:`, error);
        return 0;
      }
    });
};

// Group future events by date (starting from today)
export const groupFutureEventsByDate = (events: Event[]): Record<string, Event[]> => {
  const futureEvents = getFutureEvents(events);
  return groupEventsByDate(futureEvents);
};

// Transform GitHub events to our format
export const transformGitHubEvents = (
  githubEvents: GitHubEvent[], 
  eventLikes: Record<string, number>,
  currentYear: number
): Event[] => {
  console.log(`Transforming ${githubEvents.length} GitHub events, current year: ${currentYear}`);
  console.log('Using likes data:', eventLikes);
  
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
      const thisMonth = now.getMonth();
      const isMonthInPast = month < thisMonth;
      
      // If the month is in the past, we should probably use next year
      // otherwise use current year
      const yearToUse = isMonthInPast ? currentYear + 1 : currentYear;
      eventDate = new Date(Date.UTC(yearToUse, month, day));
      
      // Log detailed parsing information
      console.log(`Original date: ${githubEvent.date}`);
      console.log(`Day: ${day}, Month: ${month+1}, Year: ${yearToUse}`);
      console.log(`Parsed date: ${eventDate.toISOString()}`);
      
      // Debug for troubleshooting specific dates
      if (day === 6 && month === 2) { // March 6th
        console.log(`Found March 6th event: ${title}`);
        console.log(`Using year: ${yearToUse}`);
      }
    } catch (err) {
      console.warn(`Konnte Datum nicht parsen: ${githubEvent.date}`, err);
      // Fallback to today's date
      eventDate = new Date();
    }
    
    const eventId = `github-${index}`;
    
    // Get likes from the provided eventLikes map, defaulting to 0 if not found
    const likesCount = eventLikes[eventId] || 0;
    console.log(`Event ${eventId} (${title}) has ${likesCount} likes from database`);
    
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
