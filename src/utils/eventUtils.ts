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
  
  console.log(`getMonthOrFavoriteEvents: Starting with ${events.length} events`);
  
  try {
    if (showFavorites) {
      const favorites = events.filter(event => {
        if (event.id.startsWith('github-')) {
          return eventLikes[event.id] && eventLikes[event.id] > 0;
        }
        return event.likes && event.likes > 0;
      });
      console.log(`getMonthOrFavoriteEvents: Found ${favorites.length} favorites`);
      return favorites;
    }
    
    const filteredEvents = events.filter(event => {
      try {
        if (!event.date) {
          console.log(`Event ${event.id} (${event.title}) has no date, skipping`);
          return false;
        }
        
        const eventDate = parseAndNormalizeDate(event.date);
        if (isNaN(eventDate.getTime())) {
          console.warn(`Event ${event.id} (${event.title}) has invalid date: ${event.date}, skipping`);
          return false;
        }
        
        const isInCurrentMonth = isSameMonth(eventDate, currentDate);
        if (!isInCurrentMonth) {
          console.log(`Event ${event.id} (${event.title}) is not in current month, skipping`);
        }
        
        return isInCurrentMonth;
      } catch (error) {
        console.error(`Error filtering event by month: ${event.id} (${event.title}), ${event.date}`, error);
        return false;
      }
    });
    
    console.log(`getMonthOrFavoriteEvents: Found ${filteredEvents.length} events for current month`);
    
    const sortedEvents = filteredEvents.sort((a, b) => {
      try {
        const dateA = parseAndNormalizeDate(a.date);
        const dateB = parseAndNormalizeDate(b.date);
        
        const isABeforeToday = isBefore(dateA, today);
        const isBBeforeToday = isBefore(dateB, today);
        
        if (isABeforeToday && !isBBeforeToday) {
          return 1;
        } else if (!isABeforeToday && isBBeforeToday) {
          return -1;
        } else if (!isABeforeToday && !isBBeforeToday) {
          return differenceInDays(dateA, today) - differenceInDays(dateB, today);
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      } catch (error) {
        console.error(`Error sorting events by date: ${a.title} vs ${b.title}`, error);
        
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        return likesB - likesA;
      }
    });
    
    return sortedEvents;
  } catch (error) {
    console.error("Error in getMonthOrFavoriteEvents:", error);
    return events;
  }
};

// Group events by date for list view
export const groupEventsByDate = (events: Event[]): Record<string, Event[]> => {
  try {
    console.log(`groupEventsByDate: Grouping ${events.length} events`);
    
    const groupedEvents = events.reduce((acc, event) => {
      try {
        if (!event.date) {
          console.log(`Event ${event.id} (${event.title}) has no date, skipping grouping`);
          return acc;
        }
        
        const dateStr = event.date;
        
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(event);
      } catch (error) {
        console.error(`Error grouping event ${event.id} (${event.title}) by date:`, error);
      }
      return acc;
    }, {} as Record<string, Event[]>);
    
    console.log(`groupEventsByDate: Created ${Object.keys(groupedEvents).length} date groups`);
    
    Object.keys(groupedEvents).forEach(dateStr => {
      groupedEvents[dateStr].sort((a, b) => {
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        return likesB - likesA;
      });
      
      console.log(`Date ${dateStr} has ${groupedEvents[dateStr].length} events`);
    });
    
    return groupedEvents;
  } catch (error) {
    console.error("Error in groupEventsByDate:", error);
    return {};
  }
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
  
  const eventIdMap = new Map<string, number>();
  
  return githubEvents.map((githubEvent) => {
    let title = githubEvent.event;
    let location = "Bielefeld";
    let category = determineEventCategory(githubEvent.event.toLowerCase());
    
    const locationMatch = githubEvent.event.match(/\(@([^)]+)\)/);
    if (locationMatch) {
      title = githubEvent.event.replace(/\s*\(@[^)]+\)/, '');
      location = locationMatch[1];
    }
    
    const eventKey = `${title}:${githubEvent.link}`;
    let index = eventIdMap.get(eventKey);
    if (index === undefined) {
      index = eventIdMap.size;
      eventIdMap.set(eventKey, index);
    }
    const eventId = `github-${index}`;
    
    let eventDate;
    try {
      console.log(`Parsing date: ${githubEvent.date} for event: ${title}`);
      
      const dateParts = githubEvent.date.split(', ');
      if (dateParts.length < 2) {
        throw new Error(`Invalid date format: ${githubEvent.date}`);
      }
      
      const dateNumbers = dateParts[1].split('.');
      if (dateNumbers.length < 2) {
        throw new Error(`Invalid date format: ${dateParts[1]}`);
      }
      
      const day = parseInt(dateNumbers[0], 10);
      const month = parseInt(dateNumbers[1], 10) - 1;
      const now = new Date();
      const thisMonth = now.getMonth();
      const isMonthInPast = month < thisMonth;
      
      const yearToUse = isMonthInPast ? currentYear + 1 : currentYear;
      eventDate = new Date(Date.UTC(yearToUse, month, day));
      
      const formattedDate = format(eventDate, 'yyyy-MM-dd');
      console.log(`Event ${title} formatted date: ${formattedDate}`);
      
      const likesCount = eventLikes[eventId] || 0;
      
      return {
        id: eventId,
        title: title,
        description: `Mehr Informationen unter: ${githubEvent.link}`,
        date: formattedDate,
        time: "19:00",
        location: location,
        organizer: "Liebefeld Community Bielefeld",
        category: category,
        likes: likesCount,
        link: githubEvent.link
      } as Event;
    } catch (err) {
      console.warn(`Konnte Datum nicht parsen: ${githubEvent.date}`, err);
      return null;
    }
  }).filter(Boolean) as Event[];
};
