
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { Event, RsvpOption } from '../types/eventTypes';
import { useEvents } from '../hooks/useEvents';
import { useTopEvents } from '../hooks/useTopEvents';

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
  setSelectedCity: React.Dispatch<React.SetStateAction<string>>;
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    events,
    setEvents,
    isLoading,
    refreshEvents,
    handleLikeEvent,
    handleRsvpEvent,
    addUserEvent,
  } = useEvents();

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedCity, setSelectedCity] = useState('BI');
  
  const topEventsPerDay = useTopEvents(events);
  
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
