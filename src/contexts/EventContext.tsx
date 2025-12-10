
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { startOfDay } from 'date-fns';
import { Event, RsvpOption } from '../types/eventTypes';
import { useEvents } from '../hooks/useEvents';
import { useTopEvents } from '../hooks/useTopEvents';

export const cities = [
  { name: "Deutschland", abbr: "DE" },
  { name: "Bielefeld", abbr: "BI" },
  { name: "Berlin", abbr: "berlin" },
  { name: "Bremen", abbr: "bremen" },
  { name: "Dortmund", abbr: "dortmund" },
  { name: "Dresden", abbr: "dresden" },
  { name: "Düsseldorf", abbr: "düsseldorf" },
  { name: "Essen", abbr: "essen" },
  { name: "Frankfurt", abbr: "frankfurt" },
  { name: "Hamburg", abbr: "hamburg" },
  { name: "Hannover", abbr: "hannover" },
  { name: "Kopenhagen", abbr: "kopenhagen" },
  { name: "Köln", abbr: "köln" },
  { name: "Leipzig", abbr: "leipzig" },
  { name: "Lübeck", abbr: "lübeck" },
  { name: "München", abbr: "münchen" },
  { name: "Münster", abbr: "münster" },
  { name: "Nürnberg", abbr: "nürnberg" },
  { name: "Stuttgart", abbr: "stuttgart" },
];

interface EventContextProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  isLoading: boolean;
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
  selectedEvent: Event | null;
  setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  filter: string | null;
  setFilter: React.Dispatch<React.SetStateAction<string | null>>;
  handleLikeEvent: (eventId: string) => Promise<void>;
  handleRsvpEvent: (eventId: string, option: RsvpOption) => Promise<void>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  refreshEvents: () => Promise<void>;
  topEventsPerDay: Record<string, string>;
  addUserEvent: (event: Omit<Event, 'id'>) => Promise<Event>;
  selectedCity: string;
  setSelectedCity: (abbr: string) => void;
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedCity, setSelectedCityState] = useState(() => localStorage.getItem('selectedCityAbbr') || 'BI');

  const {
    events,
    setEvents,
    isLoading,
    refreshEvents,
    handleLikeEvent,
    handleRsvpEvent,
    addUserEvent,
  } = useEvents(selectedCity);
  
  const topEventsPerDay = useTopEvents(events);
  
  const setSelectedCity = useCallback((abbr: string) => {
    console.log('Setting selected city to:', abbr);
    setSelectedCityState(abbr);
    localStorage.setItem('selectedCityAbbr', abbr);
    const cityObject = cities.find(c => c.abbr.toLowerCase() === abbr.toLowerCase());
    if (cityObject) {
      localStorage.setItem('selectedCityName', cityObject.name);
    } else {
      localStorage.setItem('selectedCityName', abbr);
    }
  }, []);
  
  const value = useMemo(() => ({
    events,
    setEvents,
    isLoading,
    selectedDate,
    setSelectedDate,
    selectedEvent,
    setSelectedEvent,
    filter,
    setFilter,
    handleLikeEvent,
    handleRsvpEvent,
    showFavorites,
    setShowFavorites,
    refreshEvents,
    topEventsPerDay,
    addUserEvent,
    selectedCity,
    setSelectedCity,
  }), [
    events,
    setEvents,
    isLoading,
    selectedDate,
    selectedEvent,
    filter,
    showFavorites,
    handleLikeEvent,
    handleRsvpEvent,
    refreshEvents,
    topEventsPerDay,
    addUserEvent,
    setSelectedDate,
    setSelectedEvent,
    setFilter,
    setShowFavorites,
    selectedCity,
    setSelectedCity,
  ]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
