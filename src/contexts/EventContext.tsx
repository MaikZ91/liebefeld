// src/contexts/EventContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Event } from '@/types/eventTypes'; // Ensure Event type is imported

interface EventContextType {
  events: Event[];
  isLoading: boolean;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  refreshEvents: () => Promise<void>;
  handleLikeEvent: (eventId: string) => Promise<void>;
  handleRsvpEvent: (eventId: string, rsvpType: 'yes' | 'no' | 'maybe') => Promise<void>; // Add handleRsvpEvent
  addUserEvent: (newEvent: Omit<Event, 'id'>) => Promise<Event | undefined>;
  addCityEvents: (city: string) => Promise<void>;
}

export const cities = [
  { name: 'Bielefeld', abbr: 'BI', lat: 52.0302, lng: 8.5311 },
  { name: 'Berlin', abbr: 'B', lat: 52.5200, lng: 13.4050 },
  { name: 'Hamburg', abbr: 'HH', lat: 53.5511, lng: 9.9937 },
  { name: 'Köln', abbr: 'K', lat: 50.935173, lng: 6.953101 },
  { name: 'München', abbr: 'M', lat: 48.1351, lng: 11.5820 },
  { name: 'Leipzig', abbr: 'L', lat: 51.3396, lng: 12.3731 },
  { name: 'Dortmund', abbr: 'DO', lat: 51.5136, lng: 7.4653 },
  { name: 'Düsseldorf', abbr: 'D', lat: 51.2277, lng: 6.7735 },
  { name: 'Frankfurt', abbr: 'F', lat: 50.1109, lng: 8.6821 },
  { name: 'Stuttgart', abbr: 'S', lat: 48.7758, lng: 9.1829 },
  { name: 'Hannover', abbr: 'H', lat: 52.3759, lng: 9.7320 },
  { name: 'Bremen', abbr: 'HB', lat: 53.0793, lng: 8.8017 },
  { name: 'Dresden', abbr: 'DD', lat: 51.0504, lng: 13.7373 },
  { name: 'Nürnberg', abbr: 'N', lat: 49.4521, lng: 11.0767 },
  { name: 'Duisburg', abbr: 'DU', lat: 51.4332, lng: 6.7622 },
  { name: 'Bochum', abbr: 'BO', lat: 51.4818, lng: 7.2166 },
  { name: 'Wuppertal', abbr: 'W', lat: 51.2562, lng: 7.1543 },
  { name: 'Bonn', abbr: 'BN', lat: 50.7374, lng: 7.0982 },
  { name: 'Münster', abbr: 'MS', lat: 51.9616, lng: 7.6280 },
  { name: 'Karlsruhe', abbr: 'KA', lat: 49.0069, lng: 8.4037 },
  { name: 'Mannheim', abbr: 'MA', lat: 49.4875, lng: 8.4660 },
  { name: 'Augsburg', abbr: 'A', lat: 48.3705, lng: 10.8978 },
  { name: 'Wiesbaden', abbr: 'WI', lat: 50.0833, lng: 8.2414 },
  { name: 'Gelsenkirchen', abbr: 'GE', lat: 51.5186, lng: 7.0401 },
  { name: 'Mönchengladbach', abbr: 'MG', lat: 51.1963, lng: 6.4357 },
  { name: 'Braunschweig', abbr: 'BS', lat: 52.2692, lng: 10.5215 },
  { name: 'Chemnitz', abbr: 'C', lat: 50.8333, lng: 12.9167 },
  { name: 'Kiel', abbr: 'KI', lat: 54.3233, lng: 10.1228 },
  { name: 'Aachen', abbr: 'AC', lat: 50.7753, lng: 6.0839 },
  { name: 'Halle (Saale)', abbr: 'HAL', lat: 51.4828, lng: 11.9701 },
  { name: 'Magdeburg', abbr: 'MD', lat: 52.1205, lng: 11.6276 },
  { name: 'Freiburg im Breisgau', abbr: 'FR', lat: 47.9990, lng: 7.8421 },
  { name: 'Krefeld', abbr: 'KR', lat: 51.3283, lng: 6.5599 },
  { name: 'Mainz', abbr: 'MZ', lat: 50.0000, lng: 8.2711 },
  { name: 'Lübeck', abbr: 'HL', lat: 53.8655, lng: 10.6865 },
  { name: 'Erfurt', abbr: 'EF', lat: 50.9787, lng: 11.0292 },
  { name: 'Rostock', abbr: 'HRO', lat: 54.0924, lng: 12.1278 },
  { name: 'Kassel', abbr: 'KS', lat: 51.3172, lng: 9.4925 },
  { name: 'Hagen', abbr: 'HA', lat: 51.3541, lng: 7.4729 },
  { name: 'Hamm', abbr: 'HAM', lat: 51.6826, lng: 7.8229 },
  { name: 'Saarbrücken', abbr: 'SB', lat: 49.2366, lng: 6.9950 },
  { name: 'Mülheim an der Ruhr', abbr: 'MH', lat: 51.4287, lng: 6.8789 },
  { name: 'Potsdam', abbr: 'P', lat: 52.3906, lng: 13.0645 },
  { name: 'Ludwigshafen am Rhein', abbr: 'LU', lat: 49.4795, lng: 8.4468 },
  { name: 'Oldenburg', abbr: 'OL', lat: 53.1333, lng: 8.2167 },
  { name: 'Leverkusen', abbr: 'LEV', lat: 51.0427, lng: 6.9916 },
  { name: 'Osnabrück', abbr: 'OS', lat: 52.2797, lng: 8.0475 },
  { name: 'Solingen', abbr: 'SG', lat: 51.1730, lng: 7.0863 },
  { name: 'Herne', abbr: 'HER', lat: 51.5390, lng: 7.2185 },
  { name: 'Neuss', abbr: 'NE', lat: 51.2000, lng: 6.6944 },
  { name: 'Paderborn', abbr: 'PB', lat: 51.7189, lng: 8.7561 },
  { name: 'Regensburg', abbr: 'R', lat: 49.0134, lng: 12.1016 },
  { name: 'Würzburg', abbr: 'WÜ', lat: 49.7912, lng: 9.9531 },
  { name: 'Ingolstadt', abbr: 'IN', lat: 48.7635, lng: 11.4253 },
  { name: 'Heidelberg', abbr: 'HD', lat: 49.4076, lng: 8.6908 },
  { name: 'Darmstadt', abbr: 'DA', lat: 49.8728, lng: 8.6512 },
  { name: 'Offenbach am Main', abbr: 'OF', lat: 50.1000, lng: 8.7750 },
  { name: 'Bottrop', abbr: 'BOT', lat: 51.5200, lng: 6.9200 },
  { name: 'Pforzheim', abbr: 'PF', lat: 48.8924, lng: 8.6975 },
  { name: 'Recklinghausen', abbr: 'RE', lat: 51.5645, lng: 7.2000 },
  { name: 'Ulm', abbr: 'UL', lat: 48.4011, lng: 9.9876 },
  { name: 'Göttingen', abbr: 'GÖ', lat: 51.5328, lng: 9.9357 },
  { name: 'Heilbronn', abbr: 'HN', lat: 49.1419, lng: 9.2194 },
  { name: 'Worms', abbr: 'WO', lat: 49.6359, lng: 8.3582 },
  { name: 'Trier', abbr: 'TR', lat: 49.7499, lng: 6.6370 },
  { name: 'Jena', abbr: 'J', lat: 50.9272, lng: 11.5894 },
  { name: 'Mainz', abbr: 'MZ', lat: 50.0000, lng: 8.2711 }, // Duplikat, sollte aber kein Problem sein.
  { name: 'Erlangen', abbr: 'ER', lat: 49.5982, lng: 11.0036 },
  { name: 'Fürth', abbr: 'FÜ', lat: 49.4770, lng: 10.9912 },
  { name: 'Kaiserslautern', abbr: 'KL', lat: 49.4448, lng: 7.7686 },
  { name: 'Dessau-Roßlau', abbr: 'DE', lat: 51.8333, lng: 12.2500 },
  { name: 'Zwickau', abbr: 'Z', lat: 50.7180, lng: 12.4947 },
  { name: 'Schwerin', abbr: 'SN', lat: 53.6333, lng: 11.4167 },
  { name: 'Düren', abbr: 'DN', lat: 50.8000, lng: 6.4833 },
  { name: 'Ratingen', abbr: 'RA', lat: 51.3000, lng: 6.8333 },
  { name: 'Lünen', abbr: 'LÜN', lat: 51.5333, lng: 7.5167 },
  { name: 'Marl', abbr: 'MARL', lat: 51.6667, lng: 7.1167 },
  { name: 'Datteln', abbr: 'CAS', lat: 51.6500, lng: 7.3333 }, // PLZ von Castrop-Rauxel, korrigiert
];


const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useEvents now provides handleRsvpEvent
  const { events, isLoading, refreshEvents, handleLikeEvent, handleRsvpEvent, addUserEvent, addCityEvents } = useEvents();

  const [selectedCity, setSelectedCity] = useState<string>(
    localStorage.getItem('selectedCityAbbr') || 'BI'
  );

  // Update localStorage when selectedCity changes
  useEffect(() => {
    localStorage.setItem('selectedCityAbbr', selectedCity);
  }, [selectedCity]);

  const contextValue: EventContextType = {
    events,
    isLoading,
    selectedCity,
    setSelectedCity,
    refreshEvents,
    handleLikeEvent,
    handleRsvpEvent, // Now correctly passed from useEvents
    addUserEvent,
    addCityEvents
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};