
import { useState, useEffect } from 'react';

export const useGeocodingCache = (events: any[]) => {
  const [eventCoordinates, setEventCoordinates] = useState<Record<string, [number, number]>>({});

  // Geocoding-Funktion für Adressen mit OpenStreetMap Nominatim
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Bielefeld, Germany')}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Geocode all events when component mounts or events change
  useEffect(() => {
    const geocodeEvents = async () => {
      const newCoordinates: Record<string, [number, number]> = {};
      
      for (const event of events) {
        if (event.location && !eventCoordinates[event.id]) {
          const coords = await geocodeAddress(event.location);
          if (coords) {
            newCoordinates[event.id] = coords;
          }
        }
      }
      
      if (Object.keys(newCoordinates).length > 0) {
        setEventCoordinates(prev => ({ ...prev, ...newCoordinates }));
      }
    };

    if (events.length > 0) {
      geocodeEvents();
    }
  }, [events.length]);

  return eventCoordinates;
};
