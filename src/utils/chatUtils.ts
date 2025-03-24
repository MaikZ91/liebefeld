
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
  
  return dayEvents.sort((a, b) => {
    const aLikes = a.likes || 0;
    const bLikes = b.likes || 0;
    return bLikes - aLikes;
  });
};

const getNextWeekHighlights = (events: Event[]): string => {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addWeeks(tomorrow, 1);
  let highlights = "🗓️ <b>Highlights für die nächste Woche</b>\n\n";
  let hasEvents = false;

  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(tomorrow, i);
    const dayEvents = getEventsForDay(events, currentDay);
    
    if (dayEvents.length > 0) {
      hasEvents = true;
      const dayName = getDayOfWeekInGerman(currentDay);
      const formattedDate = format(currentDay, 'dd.MM.', { locale: de });
      
      highlights += `<div class="event-day">`;
      highlights += `<b>${dayName}, ${formattedDate}</b>: `;
      
      const topEvent = dayEvents[0];
      
      highlights += `${topEvent.title} `;
      highlights += `(${topEvent.time || '??:??'}) `;
      highlights += `@ ${topEvent.location || 'Ort unbekannt'}`;
      
      highlights += `</div>`;
      
      if (i < 6) {
        const nextDayEvents = getEventsForDay(events, addDays(tomorrow, i + 1));
        if (nextDayEvents.length > 0) {
          highlights += `<div class="day-separator"></div>`;
        }
      }
    }
  }
  
  if (!hasEvents) {
    highlights += `<div class="no-events">Für die nächste Woche sind noch keine Events geplant. Schau später wieder vorbei!</div>`;
  }
  
  return highlights;
};

const getEventDetail = (eventId: string, events: Event[]): string => {
  const event = events.find(e => e.id === eventId);
  
  if (!event) {
    return "Dieses Event konnte ich leider nicht finden.";
  }
  
  let response = `<div class="event-detail">`;
  response += `<b>🎯 ${event.title}</b>\n\n`;
  
  const date = parseISO(event.date);
  const dayOfWeek = getDayOfWeekInGerman(date);
  
  response += `📅 ${dayOfWeek}, ${event.date}\n`;
  response += `⏰ ${event.time || 'k.A.'}\n`;
  response += `📍 ${event.location || 'Ort unbekannt'}\n`;
  
  if (event.description) {
    response += `\n${event.description}\n`;
  }
  
  if (event.organizer) {
    response += `\n👥 Veranstalter: ${event.organizer}\n`;
  }
  
  const likes = event.likes || 0;
  response += `\n❤️ ${likes} Personen gefällt dieses Event`;
  
  response += `</div>`;
  
  return response;
};

export const generateResponse = (input: string, events: Event[]): string => {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check if user is asking about a specific event by ID
  const eventIdMatch = normalizedInput.match(/event:([a-f0-9-]+)/i);
  if (eventIdMatch && eventIdMatch[1]) {
    const eventId = eventIdMatch[1];
    return getEventDetail(eventId, events);
  }
  
  if ((normalizedInput.includes('highlight') || normalizedInput.includes('top events')) && 
      (normalizedInput.includes('woche') || normalizedInput.includes('nächste woche'))) {
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
    
    let response = '<div class="events-list">';
    response += '<b>Hier sind einige bevorstehende Events:</b>\n\n';
    
    upcomingEvents.forEach((event, index) => {
      response += `<div class="event-card">`;
      response += `<b>🗓️ ${event.title}</b>\n`;
      response += `📅 ${event.date} um ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n`;
      response += `🏷️ ${event.category || 'Keine Kategorie'}\n`;
      response += `</div>`;
      
      if (index < upcomingEvents.length - 1) {
        response += `<div class="event-separator"></div>`;
      }
    });
    
    response += '</div>\n\nMöchtest du mehr Details zu einem bestimmten Event erfahren?';
    
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
    
    let response = `<div class="today-events">`;
    response += `<b>Heute finden ${todayEvents.length} Events statt:</b>\n\n`;
    
    todayEvents.slice(0, 3).forEach((event, index) => {
      response += `<div class="event-card">`;
      response += `<b>🗓️ ${event.title}</b>\n`;
      response += `⏰ ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n`;
      response += `</div>`;
      
      if (index < Math.min(todayEvents.length, 3) - 1) {
        response += `<div class="event-separator"></div>`;
      }
    });
    
    if (todayEvents.length > 3) {
      response += `<div class="event-more">... und ${todayEvents.length - 3} weitere Events.</div>`;
    }
    
    response += `</div>`;
    
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
    
    let response = `<div class="tomorrow-events">`;
    response += `<b>Morgen finden ${tomorrowEvents.length} Events statt:</b>\n\n`;
    
    tomorrowEvents.slice(0, 3).forEach((event, index) => {
      response += `<div class="event-card">`;
      response += `<b>🗓️ ${event.title}</b>\n`;
      response += `⏰ ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n`;
      response += `</div>`;
      
      if (index < Math.min(tomorrowEvents.length, 3) - 1) {
        response += `<div class="event-separator"></div>`;
      }
    });
    
    if (tomorrowEvents.length > 3) {
      response += `<div class="event-more">... und ${tomorrowEvents.length - 3} weitere Events.</div>`;
    }
    
    response += `</div>`;
    
    return response;
  }
  
  if (normalizedInput.includes('wochenende')) {
    const today = new Date();
    const fridayIndex = 5;
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
    
    let response = `<div class="weekend-events">`;
    response += `<b>Am Wochenende finden ${weekendEvents.length} Events statt:</b>\n\n`;
    
    weekendEvents.slice(0, 3).forEach((event, index) => {
      const eventDate = parseISO(event.date);
      const dayName = getDayOfWeekInGerman(eventDate);
      
      response += `<div class="event-card">`;
      response += `<b>🗓️ ${event.title}</b>\n`;
      response += `📅 ${dayName}, ${event.date} um ${event.time || 'k.A.'}\n`;
      response += `📍 ${event.location || 'Ort unbekannt'}\n`;
      response += `</div>`;
      
      if (index < Math.min(weekendEvents.length, 3) - 1) {
        response += `<div class="event-separator"></div>`;
      }
    });
    
    if (weekendEvents.length > 3) {
      response += `<div class="event-more">... und ${weekendEvents.length - 3} weitere Events.</div>`;
    }
    
    response += `</div>`;
    
    return response;
  }
  
  return 'Ich kann dir Informationen zu Events in Liebefeld geben. Frag mich nach Events heute, morgen, am Wochenende oder nach den Highlights der nächsten Woche!';
};
