
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { fetchWeather } from './weatherUtils';
import { supabase } from '@/integrations/supabase/client';

export const getWelcomeMessage = () => {
  return `
    <div class="bg-green-900/10 border border-green-700/30 rounded-lg p-2 text-sm">
      Ich bin dein persönlicher Assistent für alle Liebefeld Events.
    </div>
  `;
};

export const createResponseHeader = (title: string) => {
  return `
    <h4 class="font-medium text-md mb-2">${title}</h4>
  `;
};

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// Helper function to convert text URLs to clickable links
const makeLinksClickable = (text: string): string => {
  if (!text) return '';
  
  // Regular expression to find URLs in text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Replace URLs with anchor tags
  return text.replace(urlRegex, (url) => {
    // Ensure URL doesn't already have HTML tags
    if (url.includes('<a href=')) return url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-red-500 hover:underline">${url}</a>`;
  });
};

// Fix for proper title display when an event has a link
const fixTitleDisplayWithLink = (html: string): string => {
  // Look for incorrectly formatted links where the URL is shown instead of the title
  const incorrectLinkRegex = /<a href="([^"]+)"[^>]*>https?:\/\/[^<]+<\/a>/g;
  
  // Replace with proper format where we use the title instead of showing the URL
  return html.replace(incorrectLinkRegex, (match, href) => {
    // Extract event title from nearby context if possible
    const titleRegex = new RegExp(`<h4[^>]*>[^<]*<a href="${href}"[^>]*>([^<]+)<\/a>`, 'g');
    const titleMatch = titleRegex.exec(html);
    
    if (titleMatch && titleMatch[1]) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${titleMatch[1]}</a>`;
    } else {
      // Fallback to a generic title if we can't extract it
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">Event Details</a>`;
    }
  });
};

export const formatEvents = (events: any[]) => {
  if (!events || events.length === 0) {
    return '<div class="bg-gray-900/20 border border-gray-700/30 rounded-lg p-2 text-sm">Keine Events gefunden.</div>';
  }

  // Group events by date
  const eventsByDate: Record<string, any[]> = {};
  events.forEach(event => {
    const date = event.date;
    if (!eventsByDate[date]) {
      eventsByDate[date] = [];
    }
    eventsByDate[date].push(event);
  });

  let eventsHtml = '<div class="space-y-2">';
  
  // Sort dates in ascending order
  const sortedDates = Object.keys(eventsByDate).sort();
  
  sortedDates.forEach(date => {
    // Add date header
    eventsHtml += `<div class="text-xs text-red-500 font-medium mt-2 mb-1">${date}</div>`;
    
    // Add events for this date
    eventsByDate[date].forEach(event => {
      // Process description to make links clickable
      const processedDescription = event.description ? makeLinksClickable(event.description) : '';
      
      // Format title as clickable if there's a link
      const titleHtml = event.link 
        ? `<a href="${event.link}" target="_blank" rel="noopener noreferrer">${event.title}</a>
            <svg class="w-2 h-2 inline-flex flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M7 17L17 7M17 7H8M17 7V16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>` 
        : event.title;

      eventsHtml += `
        <div class="dark-glass-card rounded-lg p-1.5 mb-0.5 w-full">
          <div class="flex justify-between items-start gap-1">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1 flex-wrap">
                <h4 class="font-medium text-sm text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1">
                  ${titleHtml}
                </h4>
              </div>
              
              <div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-white">
                <div class="flex items-center">
                  <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <span>${event.time} Uhr</span>
                </div>
                <div class="flex items-center max-w-[120px] overflow-hidden">
                  <svg class="w-3 h-3 mr-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>
                    <circle cx="12" cy="10" r="3" stroke-width="2"/>
                  </svg>
                  <span class="truncate">${event.location || 'Unbekannt'}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <div class="flex-shrink-0 flex items-center gap-0.5 text-xs font-medium whitespace-nowrap px-1 py-0 h-5 bg-black text-red-500 rounded">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/>
                </svg>
                ${event.category}
              </div>
              
              <div class="flex items-center gap-0.5">
                <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        ${processedDescription ? `<div class="pl-2 pb-2 text-xs text-gray-300">${processedDescription}</div>` : ''}
      `;
    });
  });
  
  eventsHtml += '</div>';
  return eventsHtml;
};

export const generateResponse = async (query: string, events: any[]) => {
  try {
    console.log(`Generating AI response for query: "${query}" with ${events.length} events`);
    
    // Current date for debugging and AI context
    const currentDate = new Date();
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    console.log(`Current date being sent to AI: ${formattedDate}`);
    
    // Calculate tomorrow's date
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    console.log(`Tomorrow's date: ${tomorrowStr}`);
    
    // Calculate day after tomorrow's date
    const dayAfterTomorrow = new Date(currentDate);
    dayAfterTomorrow.setDate(currentDate.getDate() + 2);
    const dayAfterTomorrowStr = format(dayAfterTomorrow, 'yyyy-MM-dd');
    console.log(`Day after tomorrow's date: ${dayAfterTomorrowStr}`);
    
    // Calculate next week's date range
    const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToAdd = currentDay === 0 ? 1 : (8 - currentDay); // If today is Sunday, add 1 for Monday, otherwise calculate days until next Monday
    
    const nextWeekStart = new Date(currentDate);
    nextWeekStart.setDate(currentDate.getDate() + daysToAdd);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Monday to Sunday = 7 days
    
    const nextWeekStartStr = format(nextWeekStart, 'yyyy-MM-dd');
    const nextWeekEndStr = format(nextWeekEnd, 'yyyy-MM-dd');
    console.log(`Next week range: ${nextWeekStartStr} (Monday) to ${nextWeekEndStr} (Sunday)`);
    
    // Log statistics about events for each time period
    const todayEvents = events.filter(e => e.date === formattedDate);
    console.log(`Events specifically for today (${formattedDate}): ${todayEvents.length}`);
    if (todayEvents.length > 0) {
      console.log('First few today events:', todayEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    const tomorrowEvents = events.filter(e => e.date === tomorrowStr);
    console.log(`Events specifically for tomorrow (${tomorrowStr}): ${tomorrowEvents.length}`);
    if (tomorrowEvents.length > 0) {
      console.log('First few tomorrow events:', tomorrowEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    const dayAfterTomorrowEvents = events.filter(e => e.date === dayAfterTomorrowStr);
    console.log(`Events specifically for day after tomorrow (${dayAfterTomorrowStr}): ${dayAfterTomorrowEvents.length}`);
    if (dayAfterTomorrowEvents.length > 0) {
      console.log('First few day after tomorrow events:', dayAfterTomorrowEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    const nextWeekEvents = events.filter(e => e.date >= nextWeekStartStr && e.date <= nextWeekEndStr);
    console.log(`Events for next week (${nextWeekStartStr} to ${nextWeekEndStr}): ${nextWeekEvents.length}`);
    if (nextWeekEvents.length > 0) {
      console.log('First few next week events:', nextWeekEvents.slice(0, 3).map(e => `${e.title} (${e.date})`));
    }
    
    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    const response = await fetch('https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/ai-event-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo`
      },
      body: JSON.stringify({
        query,
        timeOfDay: getTimeOfDay(),
        currentDate: formattedDate,
        weather: await fetchWeather(),
        allEvents: events,
        formatInstructions: "Stelle MEHRERE Events im kompakten EventCard Design dar. Zeige MINDESTENS 5-10 Events an, gruppiere nach Datum. Mache Titel klickbar wenn Link vorhanden ist. Zeige IMMER das Herz-Icon bei jedem Event."
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error with AI response: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Fix the formatting issues - correct links displaying URLs instead of titles
    let processedResponse = fixTitleDisplayWithLink(data.response);
    
    // Also process to make any plain text links clickable
    processedResponse = makeLinksClickable(processedResponse);
    
    // Return the processed response with links made clickable
    return createResponseHeader("KI-Antwort") + processedResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Show the events list as a fallback in case of timeout or other errors
    return createResponseHeader("Fehler") + `
      <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm mb-3">
        Entschuldigung, ich konnte keine KI-Antwort generieren. Hier sind die verfügbaren Events:
      </div>
      ${formatEvents(events)}`;
  }
};
