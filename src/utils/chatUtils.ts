
import { Event } from '@/types/eventTypes';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth, isAfter, isBefore, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

export const generateResponse = (input: string, events: Event[]): string => {
  // Safety check for events array
  if (!events || !Array.isArray(events)) {
    console.error("Events is not a valid array:", events);
    return "Entschuldigung, ich kann keine Eventdaten laden. Bitte versuche es später erneut.";
  }

  try {
    // Convert input to lowercase for easier matching
    const inputLower = input.toLowerCase().trim();
    
    // Get current date for comparisons
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const endOfToday = endOfDay(now);
    const weekStart = startOfWeek(now, { locale: de });
    const weekEnd = endOfWeek(now, { locale: de });
    
    // Common responses based on general greetings
    if (inputLower.match(/^(hallo|hi|hey|servus|moin|guten tag)/)) {
      return "Hallo! Ich bin dein Event-Assistent für Liebefeld. Wie kann ich dir helfen? Du kannst mich nach Events heute, morgen oder am Wochenende fragen.";
    }
    
    if (inputLower.match(/^(wie geht('|)s|wie gehts|wie geht es dir)/)) {
      return "Mir geht es gut, danke der Nachfrage! Ich bin hier, um dir Infos zu Events in Liebefeld zu geben. Wie kann ich dir helfen?";
    }
    
    if (inputLower.match(/^(danke|thx|thanks|vielen dank|herzlichen dank)/)) {
      return "Gerne! Ich helfe immer wieder. Brauchst du noch weitere Infos zu Veranstaltungen?";
    }
    
    if (inputLower.match(/^(tschüss|bye|ciao|auf wiedersehen|bis später|bis bald)/)) {
      return "Bis bald! Schau gerne wieder vorbei, wenn du Infos zu Events brauchst.";
    }
    
    // Check for event time-related queries
    if (inputLower.includes("heute") || inputLower.match(/^was (geht|gibt es|ist los) heute/)) {
      const todayEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isToday(eventDate);
        } catch (error) {
          console.error("Date parsing error for event:", event, error);
          return false;
        }
      });
      
      if (todayEvents.length === 0) {
        return "Heute finden keine Events statt. Möchtest du wissen, was in den nächsten Tagen los ist?";
      }
      
      return formatEventsList(todayEvents, "Heute");
    }
    
    if (inputLower.includes("morgen") || inputLower.match(/^was (geht|gibt es|ist los) morgen/)) {
      const tomorrowEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isTomorrow(eventDate);
        } catch (error) {
          console.error("Date parsing error for event:", event, error);
          return false;
        }
      });
      
      if (tomorrowEvents.length === 0) {
        return "Morgen finden keine Events statt. Möchtest du wissen, was am Wochenende los ist?";
      }
      
      return formatEventsList(tomorrowEvents, "Morgen");
    }
    
    if (inputLower.includes("wochenende") || inputLower.match(/^was (geht|gibt es|ist los) am wochenende/)) {
      const weekendEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          const dayOfWeek = format(eventDate, 'EEEE', { locale: de });
          return (dayOfWeek === 'Samstag' || dayOfWeek === 'Sonntag') && isAfter(eventDate, today);
        } catch (error) {
          console.error("Date parsing error for event:", event, error);
          return false;
        }
      });
      
      if (weekendEvents.length === 0) {
        return "Am Wochenende finden keine Events statt. Möchtest du wissen, was nächste Woche los ist?";
      }
      
      return formatEventsList(weekendEvents, "Am Wochenende");
    }
    
    if (inputLower.includes("woche") || inputLower.match(/^was (geht|gibt es|ist los) (diese|nächste|kommende) woche/)) {
      const thisWeekEvents = events.filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isThisWeek(eventDate, { locale: de }) && isAfter(eventDate, today);
        } catch (error) {
          console.error("Date parsing error for event:", event, error);
          return false;
        }
      });
      
      if (thisWeekEvents.length === 0) {
        return "Diese Woche finden keine weiteren Events statt.";
      }
      
      return formatEventsList(thisWeekEvents, "Diese Woche");
    }
    
    if (inputLower.includes("highlight") || inputLower.includes("empfehlung") || inputLower.includes("besonder")) {
      // Sort events by likes to get the most popular ones
      const topEvents = [...events]
        .filter(event => {
          try {
            const eventDate = parseISO(event.date);
            return isAfter(eventDate, today);
          } catch (error) {
            console.error("Date parsing error for event:", event, error);
            return false;
          }
        })
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5);
      
      if (topEvents.length === 0) {
        return "Aktuell gibt es keine besonderen Events in der nächsten Zeit.";
      }
      
      return formatEventsList(topEvents, "Highlights der nächsten Zeit");
    }
    
    // Look for specific categories
    const categories = [
      { keywords: ["musik", "konzert", "band", "sänger", "gig"], category: "Konzert" },
      { keywords: ["party", "feiern", "club", "disco"], category: "Party" },
      { keywords: ["kultur", "ausstellung", "theater", "museum"], category: "Kultur" },
      { keywords: ["sport", "fußball", "laufen", "fitness"], category: "Sport" }
    ];
    
    for (const cat of categories) {
      if (cat.keywords.some(keyword => inputLower.includes(keyword))) {
        const categoryEvents = events.filter(event => {
          try {
            const eventDate = parseISO(event.date);
            return event.category?.toLowerCase().includes(cat.category.toLowerCase()) && isAfter(eventDate, today);
          } catch (error) {
            console.error("Date parsing error for event:", event, error);
            return false;
          }
        });
        
        if (categoryEvents.length === 0) {
          return `Aktuell sind keine ${cat.category}-Events geplant.`;
        }
        
        return formatEventsList(categoryEvents, `${cat.category}-Events`);
      }
    }
    
    // Look for specific locations
    if (inputLower.includes("ort") || inputLower.includes("location")) {
      const locations = events
        .map(event => event.location)
        .filter((location, index, self) => 
          location && location.trim() !== "" && self.indexOf(location) === index
        );
      
      if (locations.length === 0) {
        return "Leider habe ich keine Informationen zu Veranstaltungsorten.";
      }
      
      return `Hier sind einige Veranstaltungsorte in Liebefeld:<br>${locations.slice(0, 10).map(loc => `- ${loc}`).join('<br>')}`;
    }
    
    // Look for specific event by name
    for (const event of events) {
      if (event.title && inputLower.includes(event.title.toLowerCase())) {
        return formatEventDetail(event);
      }
    }
    
    // Fallback to showing upcoming events if no specific query matched
    const upcomingEvents = events
      .filter(event => {
        try {
          const eventDate = parseISO(event.date);
          return isAfter(eventDate, today);
        } catch (error) {
          console.error("Date parsing error for event:", event, error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error("Date sorting error:", error);
          return 0;
        }
      })
      .slice(0, 5);
    
    if (upcomingEvents.length === 0) {
      return "Es sind aktuell keine Events geplant. Schau später nochmal vorbei!";
    }
    
    return formatEventsList(upcomingEvents, "Demnächst in Liebefeld");
  } catch (error) {
    console.error("Error generating response:", error);
    return "Entschuldigung, bei der Verarbeitung deiner Anfrage ist ein Fehler aufgetreten. Bitte versuche es später noch einmal.";
  }
};

function formatEventsList(events: Event[], title: string): string {
  try {
    if (!events || events.length === 0) {
      return `<div class="no-events">Keine ${title} Events gefunden</div>`;
    }

    // Sort events by date and time
    const sortedEvents = [...events].sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error("Date comparison error:", error);
        return 0;
      }
    });

    // Create HTML structure
    let html = `<div class="${title.toLowerCase().replace(/\s+/g, '-')}-events"><b>${title} finden ${events.length} Events statt:</b>\n\n`;
    
    sortedEvents.forEach((event, index) => {
      html += `<div class="event-card"><b>🗓️ ${event.title}</b>\n⏰ ${event.time.substring(0, 5)}\n📍 ${event.location || 'Kein Ort angegeben'}\n</div>`;
      if (index < sortedEvents.length - 1) {
        html += '<div class="event-separator"></div>';
      }
    });
    
    html += '</div>';
    return html;
  } catch (error) {
    console.error("Error formatting events list:", error);
    return `<div class="error-message">Fehler beim Formatieren der Events für "${title}"</div>`;
  }
}

function formatEventDetail(event: Event): string {
  try {
    let html = `<div class="event-detail">`;
    html += `<h3>${event.title}</h3>`;
    html += `<div class="event-date-time">📅 ${format(parseISO(event.date), 'dd.MM.yyyy')} um ${event.time.substring(0, 5)} Uhr</div>`;
    
    if (event.description) {
      html += `<div class="event-description">${event.description}</div>`;
    }
    
    if (event.location) {
      html += `<div class="event-location">📍 ${event.location}</div>`;
    }
    
    if (event.organizer) {
      html += `<div class="event-organizer">👤 Organisator: ${event.organizer}</div>`;
    }
    
    html += `<div class="event-likes">❤️ ${event.likes || 0} Likes</div>`;
    html += `<div class="event-category">🏷️ ${event.category || 'Sonstiges'}</div>`;
    
    // Add a hidden marker that can be used to find this event in the DOM
    html += `<div class="hidden" style="display:none;" data-event-details-id="${event.id}"></div>`;
    
    html += `</div>`;
    return html;
  } catch (error) {
    console.error("Error formatting event detail:", error, event);
    return `<div class="error-message">Fehler beim Anzeigen der Eventdetails</div>`;
  }
}
