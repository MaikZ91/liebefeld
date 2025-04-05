import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, addDays, 
  isToday, isTomorrow, isThisWeek, isWeekend, isAfter, isBefore, 
  addWeeks, addMonths, getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { type Event } from '../types/eventTypes';

// Helper to format events for display with enhanced styling
export const formatEvents = (filteredEvents: Event[]): string => {
  if (filteredEvents.length === 0) {
    return "<div class='text-center py-3 px-2 rounded-lg bg-gray-800/50 border border-gray-700/50'>Leider sind keine Veranstaltungen für diesen Zeitraum geplant.</div>";
  }

  const sortedEvents = [...filteredEvents].sort((a, b) => a.title.localeCompare(b.title));

  return sortedEvents
    .map(event => {
      const link = event.link || '#';
      const categoryClass = getCategoryColorClass(event.category);
      const dateStr = format(parseISO(event.date), 'E, dd.MM.', { locale: de });
      
      return `
        <div class="p-2 mb-2 rounded-lg bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700/50 hover:border-red-500/30 transition-all duration-300 animate-fade-in">
          <a href="${link}" target="_blank" class="block hover:no-underline">
            <div class="flex items-center justify-between">
              <span class="font-medium text-red-400">${event.title}</span>
              <span class="text-xs ${categoryClass} px-2 py-0.5 rounded-full">${event.category || 'Event'}</span>
            </div>
            <div class="flex items-center mt-1 text-xs text-gray-400">
              <span class="flex items-center">
                <span class="mr-1">📅</span> ${dateStr}
              </span>
              <span class="mx-2">•</span>
              <span class="flex items-center">
                <span class="mr-1">🕒</span> ${event.time} Uhr
              </span>
            </div>
            <div class="text-xs text-gray-300 mt-1 truncate">
              ${event.location || 'Liebefeld'}
            </div>
          </a>
        </div>`;
    })
    .join("");
};

// Function to get color class based on category
const getCategoryColorClass = (category?: string): string => {
  if (!category) return "bg-gray-600 text-gray-200";
  
  const categoryMap: Record<string, string> = {
    'Networking': 'bg-blue-900/70 text-blue-200',
    'Workshop': 'bg-purple-900/70 text-purple-200',
    'Sport': 'bg-green-900/70 text-green-200',
    'Kultur': 'bg-yellow-900/70 text-yellow-200',
    'Meeting': 'bg-gray-700/70 text-gray-200',
    'Party': 'bg-pink-900/70 text-pink-200',
    'Vortrag': 'bg-indigo-900/70 text-indigo-200',
    'Konzert': 'bg-red-900/70 text-red-200',
    'Ausstellung': 'bg-emerald-900/70 text-emerald-200'
  };
  
  return categoryMap[category] || "bg-gray-600 text-gray-200";
};

// Create response header with proper formatting
export const createResponseHeader = (title: string) => {
  return `
    <div class="mb-3">
      <h3 class="inline-block font-bold text-lg bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
        ${title}
      </h3>
      <div class="w-16 h-1 bg-gradient-to-r from-red-500 to-red-300 rounded-full mt-1"></div>
    </div>`;
};

// Functions to identify common query patterns
export const isListAllEventsQuery = (query: string): boolean => {
  const patterns = [
    'alle', 'verfügbar', 'liste', 'zeig mir alle', 'alles', 'zeige alle', 'anzeigen', 'show all'
  ];
  return patterns.some(pattern => query.toLowerCase().includes(pattern));
};

export const isEventsForTodayQuery = (query: string): boolean => {
  const patterns = [
    'heute', 'today', 'was geht', 'was ist los', 'was läuft', 'was gibt es', 'was passiert'
  ];
  
  return patterns.some(pattern => query.toLowerCase().includes(pattern));
};

export const checkCategoryQuery = (query: string): { isCategoryQuery: boolean; category: string } => {
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

export const checkLocationQuery = (query: string): { isLocationQuery: boolean; location: string } => {
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

export const checkPriceQuery = (query: string): { isPriceQuery: boolean; priceRange: string } => {
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

export const checkTimeSpecificQuery = (query: string): { isTimeQuery: boolean; timeFrame: string } => {
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
    if (pattern.some(p => query.toLowerCase().includes(p))) {
      return { isTimeQuery: true, timeFrame };
    }
  }

  // If the query has phrases like "was geht" or "was ist los" without explicit time,
  // default to today
  if (isEventsForTodayQuery(query)) {
    return { isTimeQuery: true, timeFrame: 'today' };
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

// Get the monthly highlights (events with more than 10 likes)
export const getMonthlyHighlights = (events: Event[], threshold: number = 10): Event[] => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  console.log(`Getting highlights for ${format(monthStart, 'MMMM yyyy', { locale: de })}`);
  
  return events
    .filter(event => {
      try {
        if (!event.date) return false;
        const eventDate = parseISO(event.date);
        
        // Check if event is in the current month
        const isInCurrentMonth = isWithinInterval(eventDate, {
          start: monthStart,
          end: monthEnd
        });
        
        // Check if the event has more likes than the threshold
        const hasEnoughLikes = (event.likes || 0) > threshold;
        
        return isInCurrentMonth && hasEnoughLikes;
      } catch (error) {
        console.error(`Error filtering month highlights for event: ${event.title}`, error);
        return false;
      }
    })
    .sort((a, b) => {
      // Sort by likes count (highest first)
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      return likesB - likesA;
    });
};

// Generate a response based on a user query
export const generateResponse = (query: string, events: Event[]): string => {
  const normalizedQuery = query.toLowerCase();
  
  console.log(`Generating response with ${events.length} events for query: "${query}"`);
  
  // Check for monthly highlights query
  if (normalizedQuery.includes('highlight') || 
      (normalizedQuery.includes('monat') && 
       (normalizedQuery.includes('top') || normalizedQuery.includes('beste') || 
        normalizedQuery.includes('beliebte')))) {
    console.log('Detected query for monthly highlights');
    
    const highlights = getMonthlyHighlights(events);
    const currentMonth = format(new Date(), 'MMMM yyyy', { locale: de });
    
    return `${createResponseHeader(`Highlights im ${currentMonth}`)}${formatEvents(highlights)}`;
  }
  
  // Check if the query is for today's events in Liebefeld
  if (normalizedQuery.includes('liebefeld') && isEventsForTodayQuery(normalizedQuery)) {
    console.log('Detected query for today\'s events in Liebefeld');
    
    // Filter events for today
    const todayEvents = events.filter(event => {
      try {
        if (!event.date) return false;
        const eventDate = parseISO(event.date);
        return isToday(eventDate);
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error);
        return false;
      }
    });
    
    const today = new Date();
    return `${createResponseHeader(`Events heute in Liebefeld (${format(today, 'dd.MM.', { locale: de })})`)}${formatEvents(todayEvents)}`;
  }
  
  // Check if the user is asking for all events
  if (isListAllEventsQuery(normalizedQuery)) {
    return formatEvents(events);
  }

  // Check for time-specific queries
  const timeQuery = checkTimeSpecificQuery(normalizedQuery);
  // Check for category queries
  const categoryQuery = checkCategoryQuery(normalizedQuery);
  
  // Handle combination of time and category
  if (timeQuery.isTimeQuery && categoryQuery.isCategoryQuery) {
    console.log(`Combination query detected: ${timeQuery.timeFrame} + ${categoryQuery.category}`);
    
    // First filter by time
    const { events: timeFilteredEvents } = processTimeQuery(timeQuery.timeFrame, events);
    
    // Then filter by category
    const combinedFilteredEvents = timeFilteredEvents.filter(event => 
      event.category?.toLowerCase() === categoryQuery.category.toLowerCase() || 
      event.title.toLowerCase().includes(categoryQuery.category.toLowerCase())
    );
    
    const timeTitle = timeQuery.timeFrame === 'nextWeek' ? 'nächste Woche' : 
                      timeQuery.timeFrame === 'thisWeek' ? 'diese Woche' : 
                      timeQuery.timeFrame === 'weekend' ? 'dieses Wochenende' : 
                      timeQuery.timeFrame === 'nextWeekend' ? 'nächstes Wochenende' : 
                      timeQuery.timeFrame === 'today' ? 'heute' : 
                      timeQuery.timeFrame === 'tomorrow' ? 'morgen' : 'demnächst';
                        
    return `${createResponseHeader(`${categoryQuery.category}-Events ${timeTitle}:`)}${formatEvents(combinedFilteredEvents)}`;
  }
  
  // Handle time-specific queries without category
  if (timeQuery.isTimeQuery) {
    const { title, events: filteredEvents } = processTimeQuery(timeQuery.timeFrame, events);
    return `${createResponseHeader(title)}${formatEvents(filteredEvents)}`;
  }

  // Handle category queries without time specification
  if (categoryQuery.isCategoryQuery) {
    const categoryEvents = events.filter(event => 
      event.category?.toLowerCase() === categoryQuery.category.toLowerCase() || 
      event.title.toLowerCase().includes(categoryQuery.category.toLowerCase())
    );
    return `${createResponseHeader(`${categoryQuery.category}-Events:`)}${formatEvents(categoryEvents)}`;
  }

  // Check for location queries
  const locationQuery = checkLocationQuery(normalizedQuery);
  if (locationQuery.isLocationQuery) {
    // Process location based events
    const locationEvents = events.filter(event => 
      event.location?.toLowerCase().includes(locationQuery.location.toLowerCase())
    );
    return `${createResponseHeader(`Events in ${locationQuery.location}:`)}${formatEvents(locationEvents)}`;
  }

  // Handle specific price ranges
  const priceQuery = checkPriceQuery(normalizedQuery);
  if (priceQuery.isPriceQuery) {
    // This is a placeholder - we would need actual price data in the event objects
    return `${createResponseHeader(`${priceQuery.priceRange} Events:`)}Preisfilterung ist aktuell nicht verfügbar.`;
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
  return `<div class="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 animate-fade-in">
    <p class="font-bold text-red-400">Ich verstehe deine Frage leider nicht ganz.</p>
    <p>Du kannst mich zum Beispiel fragen:</p>
    <ul class="space-y-2 pl-5">
      <li class="flex items-center">
        <span class="text-red-400 mr-2">❤️</span> Was geht heute los?
      </li>
      <li class="flex items-center">
        <span class="text-red-400 mr-2">❤️</span> Was ist am Wochenende los?
      </li>
      <li class="flex items-center">
        <span class="text-red-400 mr-2">❤️</span> Welche Events gibt es nächste Woche?
      </li>
      <li class="flex items-center">
        <span class="text-red-400 mr-2">❤️</span> Gibt es Konzerte diese Woche?
      </li>
      <li class="flex items-center">
        <span class="text-red-400 mr-2">❤️</span> Welche Ausstellungen kann ich besuchen?
      </li>
      <li class="flex items-center">
        <span class="text-red-400 mr-2">❤️</span> Events im Zentrum von Liebefeld?
      </li>
    </ul>
  </div>`;
};

// Initial welcome message for the chatbot
export const getWelcomeMessage = (): string => {
  return `
  <div class="space-y-3 animate-fade-in">
    <div class="text-center mb-3">
      <span class="inline-block text-2xl mb-2">❤️</span>
      <h3 class="text-lg font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">Willkommen beim Liebefeld Event-Assistent!</h3>
    </div>
    
    <p class="text-sm">Ich halte dich über alle spannenden Veranstaltungen in Liebefeld auf dem Laufenden. Frag mich einfach nach Events!</p>
    
    <div class="bg-gray-800/40 rounded-lg p-2 mt-2">
      <p class="text-xs text-gray-300 mb-1">Beispiele:</p>
      <ul class="space-y-1.5 text-sm">
        <li class="flex items-start">
          <span class="text-red-400 mr-2">❤️</span>
          <span>Was ist heute los?</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-400 mr-2">❤️</span>
          <span>Zeige mir alle Events am Wochenende</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-400 mr-2">❤️</span>
          <span>Gibt es Konzerte in dieser Woche?</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-400 mr-2">❤️</span>
          <span>Welche Veranstaltungen sind im nächsten Monat?</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-400 mr-2">❤️</span>
          <span>Ausstellungen in Liebefeld?</span>
        </li>
      </ul>
    </div>
  </div>`;
};
