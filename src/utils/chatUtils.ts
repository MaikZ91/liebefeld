import { formatDistance, parseISO, format, addDays, startOfDay, endOfDay, isBefore, isAfter, isSameDay, addWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { Event } from '@/types/eventTypes';

export const getWelcomeMessage = (): string => {
  const messages = [
    "Hallo! Ich bin der Liebefeld Bot. Frag mich nach Events in deiner Gegend!",
    "Grüezi! Auf der Suche nach lokalen Events? Ich helfe dir gerne weiter!",
    "Willkommen! Ich kenne alle Events in Liebefeld und Umgebung. Wie kann ich helfen?",
    "Hi! Lust auf Events in Liebefeld? Frag mich einfach!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

const getDayOfWeekInGerman = (date: Date): string => {
  return format(date, 'EEEE', { locale: de });
};

const getEventsForDay = (events: Event[], date: Date): Event[] => {
  const dayEvents = events.filter(event => {
    const eventDate = parseISO(event.date);
    return isSameDay(eventDate, date);
  });
  
  // Sort by likes or RSVP counts (descending)
  return dayEvents.sort((a, b) => {
    const aLikes = a.likes || 0;
    const bLikes = b.likes || 0;
    return bLikes - aLikes;
  });
};

const getNextWeekHighlights = (events: Event[]): string => {
  const today = startOfDay(new Date());
  const nextWeek = addWeeks(today, 1);
  let highlights = "🌟 <b>Highlights für die nächste Woche:</b>\n\n";
  let hasEvents = false;

  // Loop through the next 7 days
  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(today, i);
    const dayEvents = getEventsForDay(events, currentDay);
    
    // If there are events on this day, add them to the highlights
    if (dayEvents.length > 0) {
      hasEvents = true;
      const dayName = getDayOfWeekInGerman(currentDay);
      const formattedDate = format(currentDay, 'dd.MM.', { locale: de });
      
      highlights += `<b>${dayName}, ${formattedDate}</b>\n`;
      
      // Get up to top 3 events for the day
      const topEvents = dayEvents.slice(0, 3);
      topEvents.forEach((event, index) => {
        const likes = event.likes || 0;
        const rsvpYes = event.rsvp_yes || 0;
        
        highlights += `- ${event.title} (${event.time || '?'}, ${event.location || 'k.A.'})`;
        if (likes > 0 || rsvpYes > 0) {
          highlights += ` • ${likes + rsvpYes} Personen interessiert`;
        }
        highlights += '\n';
      });
      
      if (dayEvents.length > 3) {
        highlights += `... und ${dayEvents.length - 3} weitere\n`;
      }
      
      highlights += '\n';
    }
  }
  
  if (!hasEvents) {
    highlights += "Für die nächste Woche sind noch keine Events geplant. Schau später wieder vorbei!";
  }
  
  return highlights;
};

export const generateResponse = (input: string, events: Event[]): string => {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for next week's highlights query
  if (normalizedInput.includes('highlight') && (normalizedInput.includes('woche') || normalizedInput.includes('nächste woche'))) {
    return getNextWeekHighlights(events);
  }
  
  if (normalizedInput.includes('hallo') || normalizedInput.includes('hi') || normalizedInput.includes('grüezi')) {
    return 'Hallo! Wie kann ich dir mit Events in Liebefeld helfen?';
  }
  
  if (normalizedInput.includes('danke') || normalizedInput.includes('merci')) {
    return 'Gerne! Gibt es noch etwas, wobei ich dir helfen kann?';
  }
  
  if (normalizedInput.includes('event') || normalizedInput.includes('veranstaltung')) {
    if (events.length === 0) {
      return 'Leider habe ich keine Events in der Datenbank gefunden. Schau später wieder vorbei!';
    }
    
    const today = new Date();
    const upcomingEvents = events
      .filter(event => {
        const eventDate = parseISO(event.date);
        return isAfter(eventDate, today) || isSameDay(eventDate, today);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
    
    if (upcomingEvents.length === 0) {
      return 'Es sind derzeit keine kommenden Events geplant. Schau später wieder vorbei!';
    }
    
    let response = 'Hier sind einige bevorstehende Events:\n\n';
    
    upcomingEvents.forEach(event => {
      response += `🗓️ <b>${event.title}</b>\n`;
      response += `📅 ${event.date} um ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n`;
      response += `🏷️ ${event.category || 'Keine Kategorie'}\n\n`;
    });
    
    response += 'Möchtest du mehr Details zu einem bestimmten Event erfahren?';
    
    return response;
  }
  
  if (normalizedInput.includes('heute')) {
    const today = new Date();
    const todayEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, today);
    });
    
    if (todayEvents.length === 0) {
      return 'Heute finden keine Events statt. Frag mich nach Events für morgen oder die nächsten Tage!';
    }
    
    let response = `Heute finden ${todayEvents.length} Events statt:\n\n`;
    
    todayEvents.slice(0, 3).forEach(event => {
      response += `🗓️ <b>${event.title}</b>\n`;
      response += `🕒 ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n\n`;
    });
    
    if (todayEvents.length > 3) {
      response += `... und ${todayEvents.length - 3} weitere Events.\n\n`;
    }
    
    return response;
  }
  
  if (normalizedInput.includes('morgen')) {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, tomorrow);
    });
    
    if (tomorrowEvents.length === 0) {
      return 'Morgen finden keine Events statt. Frag mich nach Events für die nächsten Tage!';
    }
    
    let response = `Morgen finden ${tomorrowEvents.length} Events statt:\n\n`;
    
    tomorrowEvents.slice(0, 3).forEach(event => {
      response += `🗓️ <b>${event.title}</b>\n`;
      response += `🕒 ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n\n`;
    });
    
    if (tomorrowEvents.length > 3) {
      response += `... und ${tomorrowEvents.length - 3} weitere Events.\n\n`;
    }
    
    return response;
  }
  
  if (normalizedInput.includes('wochenende')) {
    const today = new Date();
    const fridayIndex = 5; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const saturdayIndex = 6;
    const sundayIndex = 0;
    
    const weekendEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      const dayOfWeek = eventDate.getDay();
      return (dayOfWeek === fridayIndex || dayOfWeek === saturdayIndex || dayOfWeek === sundayIndex) && 
             (isAfter(eventDate, today) || isSameDay(eventDate, today));
    }).sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    if (weekendEvents.length === 0) {
      return 'Am Wochenende finden keine Events statt. Frag mich nach Events für die nächsten Tage!';
    }
    
    let response = `Am Wochenende finden ${weekendEvents.length} Events statt:\n\n`;
    
    weekendEvents.slice(0, 3).forEach(event => {
      const eventDate = parseISO(event.date);
      const dayName = getDayOfWeekInGerman(eventDate);
      
      response += `🗓️ <b>${event.title}</b>\n`;
      response += `📅 ${dayName}, ${event.date} um ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n\n`;
    });
    
    if (weekendEvents.length > 3) {
      response += `... und ${weekendEvents.length - 3} weitere Events.\n\n`;
    }
    
    return response;
  }
  
  // Default response if no specific query matched
  return 'Ich kann dir Informationen zu Events in Liebefeld geben. Frag mich nach Events heute, morgen, am Wochenende oder nach den Highlights der nächsten Woche!';
};
