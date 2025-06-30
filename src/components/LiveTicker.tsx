// src/components/LiveTicker.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Calendar, ThumbsUp } from 'lucide-react';
import { format, parseISO, isSameMonth, startOfDay, isAfter, isToday, addDays, isWithinInterval, endOfDay } from 'date-fns'; // Added isWithinInterval, endOfDay
import { de } from 'date-fns/locale';
import { type Event } from '../types/eventTypes';
import { cities } from '@/contexts/EventContext'; // Importiere die Städte-Liste

interface LiveTickerProps {
  events: Event[];
  tickerRef?: React.RefObject<HTMLDivElement>;
  isLoadingEvents?: boolean;
  selectedCity?: string; // NEU: Prop für die ausgewählte Stadt
}

const LiveTicker: React.FC<LiveTickerProps> = ({ events, tickerRef, isLoadingEvents = false, selectedCity }) => {
  const tickerEvents = useMemo(() => {
    // Filtere und sortiere nur, wenn Events vorhanden sind.
    // Ansonsten gib ein leeres Array zurück, um die Rendering-Logik zu vereinfachen.
    if (events.length === 0) return [];

    const currentDate = new Date();
    const today = startOfDay(new Date()); // Start of today
    const thirtyDaysFromTodayInclusiveEnd = endOfDay(addDays(today, 29)); // End of day for the 30th day (today + 29 more days)

    // Filter Events nach ausgewählter Stadt
    const cityFilteredEvents = events.filter(event => {
      if (!selectedCity) return true; // Wenn keine Stadt ausgewählt, alle Events zeigen
      
      const cityObject = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase());
      const cityName = cityObject ? cityObject.name : selectedCity;
      const targetCityName = cityName.toLowerCase();

      const eventCity = event.city ? event.city.toLowerCase() : null;

      // Wenn "Bielefeld" ausgewählt ist, auch Events ohne explizite Stadtzuweisung einschließen
      if (targetCityName === 'bielefeld') {
        return !eventCity || eventCity === 'bielefeld';
      }
      
      // Für andere Städte, exakte Übereinstimmung erforderlich
      return eventCity === targetCityName;
    });

    const next30DaysEvents = cityFilteredEvents.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parseISO(event.date);
        // NEU: Filtere Events, die im Intervall [today, thirtyDaysFromTodayInclusiveEnd] liegen
        return isWithinInterval(eventDate, { start: today, end: thirtyDaysFromTodayInclusiveEnd });
      } catch (e) {
        console.error(`Error parsing event date ${event.date}:`, e); // Log parsing errors
        return false;
      }
    });

    // Sortiere ALLE relevanten Events (der nächsten 30 Tage und der ausgewählten Stadt)
    // zuerst nach Likes (absteigend), dann nach Datum (aufsteigend).
    return next30DaysEvents.sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;

      if (likesB !== likesA) {
        return likesB - likesA; // Sortiere nach Likes (absteigend)
      }

      // Bei gleichen Likes, sortiere nach Datum (aufsteigend)
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
  }, [events, selectedCity]); // selectedCity als Abhängigkeit hinzufügen
  
  const [isPaused, setIsPaused] = useState(false);
  const innerTickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div 
        className="text-white overflow-hidden py-0.5 relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        ref={tickerRef}
      >
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[5]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[5]"></div>
        
        <div className="ml-0 mr-0 overflow-hidden">
          <div 
            ref={innerTickerRef}
            className={`whitespace-nowrap inline-block ${isPaused ? 'ticker-paused' : 'ticker-scroll'}`}
          >
            {isLoadingEvents && tickerEvents.length === 0 ? (
              // Ladezustand: Zeige "Lade Events..." an
              <span className="inline-block mx-3">
                <span className="text-gray-400 text-sm animate-pulse">Lade Events...</span>
              </span>
            ) : tickerEvents.length > 0 ? (
              // Events sind da: Zeige die Events an
              <>
                {/* Doppele die Liste, um einen nahtlosen Loop zu ermöglichen */}
                {[...tickerEvents, ...tickerEvents].map((event, index) => (
                  <div 
                    key={`${event.id}-${index}`} 
                    className="inline-block mx-3"
                  >
                    <span className="inline-flex items-center">
                      <span className="text-red-500 font-semibold mr-1 text-sm">
                        {(() => {
                          try {
                            const date = parseISO(event.date);
                            return format(date, 'dd.MM', { locale: de });
                          } catch {
                            return 'Datum?';
                          }
                        })()}:
                      </span>
                      <span className="text-white mr-1 text-sm">{event.title}</span>
                      <span className="text-gray-400 text-xs mr-1">({event.location || 'Keine Ortsangabe'})</span>
                      <span className="text-yellow-500 text-xs flex items-center">
                        <ThumbsUp className="w-3 h-3 mr-0.5" /> 
                        {event.likes || 0}
                      </span>
                    </span>
                    <span className="mx-2 text-red-500">•</span>
                  </div>
                ))}
              </>
            ) : (
              // Keine Events und nicht mehr am Laden: Zeige Standardnachricht an
              <span className="inline-block mx-3 text-gray-400 text-sm">
                Aktuell keine Top Events für {selectedCity ? cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity : 'deine Stadt'} verfügbar.
              </span>
            )}
          </div>
        </div>
        
        <style>{` /* jsx removed */
            @keyframes ticker {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .ticker-scroll {
              animation: ticker ${isLoadingEvents && tickerEvents.length === 0 ? '20s' : '90s'} linear infinite;
            }
            .ticker-paused {
              animation-play-state: paused;
            }
          `}</style>
      </div>
      
      <div className="w-full h-0.5 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 h-full w-8 bg-red-500 animate-bounce"></div>
      </div>
    </div>
  );
};

export default LiveTicker;