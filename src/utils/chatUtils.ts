import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, addDays, 
  isToday, isTomorrow, isThisWeek, isWeekend, isAfter, isBefore, 
  addWeeks, addMonths, getMonth, getYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from '../types/eventTypes';

// Helper to format events for display
export const formatEvents = (filteredEvents: Event[]): string => {
  if (filteredEvents.length === 0) {
    return "Leider sind keine Veranstaltungen für diesen Zeitraum geplant.";
  }

  const sortedEvents = [...filteredEvents].sort((a, b) => a.title.localeCompare(b.title));

  return sortedEvents
    .map(event => {
      const link = event.link || '#';
      return `<a href="${link}" target="_blank" class="block text-blue-400 hover:underline py-1">${event.title}</a>`;
    })
    .join("");
};

// Create response header with proper formatting
export const createResponseHeader = (title: string) => {
  return `<h3 class="font-bold text-lg text-red-400 mb-2">${title}</h3>`;
};

// Functions to identify common query patterns
const isListAllEventsQuery = (query: string): boolean => {
  const patterns = [
    'alle', 'verfügbar', 'liste', 'zeig mir alle', 'was geht', 'gibts', 'gibt es',
    'übersicht', 'welche events', 'alles', 'zeige alle', 'anzeigen', 'show all'
  ];
  return patterns.some(pattern => query.includes(pattern));
};

const isCategoryQuery = (query: string): { isCategoryQuery: boolean; category: string } => {
  const categoryPatterns = [
    { pattern: ['konzert', 'music', 'band', 'festival', 'musik'], category: 'Konzert' },
    { pattern: ['party', 'feier', 'feiern', 'fete', 'disco'], category: 'Party' },
    { pattern: ['ausstellung', 'exhibition', 'museum', 'galerie', 'kunst', 'art'], category: 'Ausstellung' },
    { pattern: ['sport', 'sportlich', 'fitness', 'laufen', 'fußball', 'soccer'], category: 'Sport' },
    { pattern: ['workshop', 'seminar', 'kurs', 'lernen', 'weiterbildung'], category: 'Workshop' },
    { pattern: ['kultur', 'cultural', 'theater', 'schauspiel', 'film', 'kino'], category: 'Kultur' }
  ];

  for (const { pattern, category } of categoryPatterns) {
    if (pattern.some(p => query.includes(p))) {
      return { isCategoryQuery: true, category };
    }
  }

  return { isCategoryQuery: false, category: '' };
};

const isLocationQuery = (query: string): { isLocationQuery: boolean; location: string } => {
  const locationPatterns = [
    { pattern: ['in der nähe', 'nearby', 'um die ecke', 'in meiner nähe'], location: 'nearby' },
    { pattern: ['zentrum', 'innenstadt', 'city center', 'downtown'], location: 'center' },
    { pattern: ['außerhalb', 'outskirts', 'vorort', 'suburb'], location: 'outskirts' }
  ];

  for (const { pattern, location } of locationPatterns) {
    if (pattern.some(p => query.includes(p))) {
      return { isLocationQuery: true, location };
    }
  }

  return { isLocationQuery: false, location: '' };
};

const isPriceQuery = (query: string): { isPriceQuery: boolean; priceRange: string } => {
  const pricePatterns = [
    { pattern: ['kostenlos', 'free', 'gratis', 'umsonst'], priceRange: 'free' },
    { pattern: ['günstig', 'cheap', 'preiswert', 'budget'], priceRange: 'cheap' },
    { pattern: ['teuer', 'expensive', 'premium', 'luxus'], priceRange: 'expensive' }
  ];

  for (const { pattern, priceRange } of pricePatterns) {
    if (pattern.some(p => query.includes(p))) {
      return { isPriceQuery: true, priceRange };
    }
  }

  return { isPriceQuery: false, priceRange: '' };
};

const isTimeSpecificQuery = (query: string): { isTimeQuery: boolean; timeFrame: string } => {
  const timePatterns = [
    { pattern: ['heute', 'today', 'jetzt', 'now'], timeFrame: 'today' },
    { pattern: ['morgen', 'tomorrow'], timeFrame: 'tomorrow' },
    { pattern: ['wochenende', 'weekend', 'samstag', 'sonntag', 'saturday', 'sunday'], timeFrame: 'weekend' },
    { pattern: ['diese woche', 'this week', 'aktuelle woche', 'current week'], timeFrame: 'thisWeek' },
    { pattern: ['nächste woche', 'next week', 'kommende woche'], timeFrame: 'nextWeek' },
    { pattern: ['nächsten monat', 'next month', 'im kommenden monat'], timeFrame: 'nextMonth' },
    { pattern: ['nächstes wochenende', 'next weekend', 'kommendes wochenende'], timeFrame: 'nextWeekend' }
  ];

  for (const { pattern, timeFrame } of timePatterns) {
    if (pattern.some(p => query.includes(p))) {
      return { isTimeQuery: true, timeFrame };
    }
  }

  return { isTimeQuery: false, timeFrame: '' };
};

// Process time-specific queries
export const processTimeQuery = (timeFrame: string, events: Event[]): { title: string, events: Event[] } => {
  const today = new Date();
  
  switch (timeFrame) {
    case 'today': {
      const todayEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isToday(eventDate);
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      return {
        title: `Events heute (${format(today, 'dd.MM.', { locale: de })})`,
        events: todayEvents
      };
    }
    
    case 'tomorrow': {
      const tomorrow = addDays(today, 1);
      const tomorrowEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isTomorrow(eventDate);
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      return {
        title: `Events morgen (${format(tomorrow, 'dd.MM.', { locale: de })})`,
        events: tomorrowEvents
      };
    }
    
    case 'weekend': {
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const thisWeekendStart = addDays(thisWeekStart, 5);
      const thisWeekendEnd = addDays(thisWeekStart, 6);
      
      const weekendEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isWithinInterval(eventDate, { 
            start: thisWeekendStart, 
            end: addDays(thisWeekendEnd, 1)
          });
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      
      return {
        title: `Events dieses Wochenende (${format(thisWeekendStart, 'dd.MM.', { locale: de })} - ${format(thisWeekendEnd, 'dd.MM.', { locale: de })})`,
        events: weekendEvents
      };
    }
    
    case 'nextWeekend': {
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const nextWeekStart = addDays(thisWeekStart, 7);
      const nextWeekendStart = addDays(nextWeekStart, 5);
      const nextWeekendEnd = addDays(nextWeekStart, 6);
      
      const nextWeekendEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isWithinInterval(eventDate, { 
            start: nextWeekendStart, 
            end: addDays(nextWeekendEnd, 1)
          });
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      
      return {
        title: `Events nächstes Wochenende (${format(nextWeekendStart, 'dd.MM.', { locale: de })} - ${format(nextWeekendEnd, 'dd.MM.', { locale: de })})`,
        events: nextWeekendEvents
      };
    }
    
    case 'thisWeek': {
      const thisWeekEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isThisWeek(eventDate, { weekStartsOn: 1 });
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      return {
        title: "Events diese Woche",
        events: thisWeekEvents
      };
    }
    
    case 'nextWeek': {
      const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
      const nextWeekEnd = addDays(nextWeekStart, 6);
      
      const nextWeekEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isWithinInterval(eventDate, { 
            start: nextWeekStart, 
            end: nextWeekEnd 
          });
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      return {
        title: "Events nächste Woche",
        events: nextWeekEvents
      };
    }
    
    case 'nextMonth': {
      const nextMonth = addMonths(today, 1);
      const nextMonthEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return getMonth(eventDate) === getMonth(nextMonth) && 
                 getYear(eventDate) === getYear(nextMonth);
        } catch (error) {
          console.error(`Error parsing date for event: ${event.title}`, error);
          return false;
        }
      });
      return {
        title: `Events im ${format(nextMonth, 'MMMM yyyy', { locale: de })}`,
        events: nextMonthEvents
      };
    }
    
    default:
      return {
        title: "Alle Events",
        events: []
      };
  }
};

// Generate a response based on a user query
export const generateResponse = (query: string, events: Event[]): string => {
  const normalizedQuery = query.toLowerCase();
  
  console.log(`Generating response with ${events.length} events for query: "${query}"`);
  
  // Check if the user is asking for all events
  if (isListAllEventsQuery(normalizedQuery)) {
    return formatEvents(events);
  }

  // Check for time-specific queries
  const { isTimeQuery, timeFrame } = isTimeSpecificQuery(normalizedQuery);
  if (isTimeQuery) {
    const { title, events: filteredEvents } = processTimeQuery(timeFrame, events);
    return `${createResponseHeader(title)}${formatEvents(filteredEvents)}`;
  }

  // Check for category queries
  const { isCategoryQuery, category } = isCategoryQuery(normalizedQuery);
  if (isCategoryQuery) {
    const categoryEvents = events.filter(event => 
      event.category?.toLowerCase() === category.toLowerCase() || 
      event.title.toLowerCase().includes(category.toLowerCase())
    );
    return `${createResponseHeader(`${category}-Events:`)}${formatEvents(categoryEvents)}`;
  }

  // Check for location queries
  const { isLocationQuery, location } = isLocationQuery(normalizedQuery);
  if (isLocationQuery) {
    // Process location based events
    const locationEvents = events.filter(event => 
      event.location?.toLowerCase().includes(location.toLowerCase())
    );
    return `${createResponseHeader(`Events in ${location}:`)}${formatEvents(locationEvents)}`;
  }

  // Handle specific price ranges
  const { isPriceQuery, priceRange } = isPriceQuery(normalizedQuery);
  if (isPriceQuery) {
    // This is a placeholder - we would need actual price data in the event objects
    return `${createResponseHeader(`${priceRange} Events:`)}Preisfilterung ist aktuell nicht verfügbar.`;
  }

  // Search for keywords in the query (fallback)
  const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 3);
  if (searchTerms.length > 0) {
    const matchingEvents = events.filter(event => {
      const eventTitle = event.title.toLowerCase();
      const eventDescription = event.description?.toLowerCase() || '';
      return searchTerms.some(term => 
        eventTitle.includes(term) || eventDescription.includes(term)
      );
    });
    
    if (matchingEvents.length > 0) {
      return `${createResponseHeader("Gefundene Events:")}${formatEvents(matchingEvents)}`;
    }
  }
  
  // Default response if no match is found
  return `<div class="space-y-2">
    <p class="font-bold">Ich verstehe deine Frage leider nicht ganz.</p>
    <p>Du kannst mich zum Beispiel fragen:</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>Was geht heute los?</li>
      <li>Was ist am Wochenende los?</li>
      <li>Welche Events gibt es nächste Woche?</li>
      <li>Gibt es Konzerte diese Woche?</li>
      <li>Welche Ausstellungen kann ich besuchen?</li>
      <li>Events im Zentrum von Liebefeld?</li>
    </ul>
  </div>`;
};

// Initial welcome message for the chatbot
export const getWelcomeMessage = (): string => {
  return 'Willkommen beim Liebefeld Event-Assistent! 👋<br><br>' + 
    'Ich halte dich über alle spannenden Veranstaltungen in Liebefeld auf dem Laufenden. Frag mich einfach nach Events, z.B.:<br>' +
    '• "Was ist heute los?"<br>' +
    '• "Zeige mir alle Events am Wochenende"<br>' +
    '• "Gibt es Konzerte in dieser Woche?"<br>' +
    '• "Welche Veranstaltungen sind im nächsten Monat?"<br>' +
    '• "Ausstellungen in Liebefeld?"';
};
