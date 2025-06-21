
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EventCoordinates {
  [eventId: string]: [number, number];
}

const EventHeatmap: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [eventCoordinates, setEventCoordinates] = useState<EventCoordinates>({});
  
  const { events, isLoading } = useEvents();

  // Filter events for Bielefeld
  const bielefeldEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (event) => !event.city || 
        event.city.toLowerCase() === 'bielefeld' || 
        event.city.toLowerCase() === 'bi'
    );
  }, [events]);

  // Get unique categories
  const categories = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(bielefeldEvents.map((e) => e.category))),
    ];
  }, [bielefeldEvents]);

  // Filter events based on category and date
  const filteredEvents = useMemo(() => {
    return bielefeldEvents.filter((event) => {
      const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
      const dateMatch = !dateFilter || event.date === dateFilter;
      return categoryMatch && dateMatch;
    });
  }, [bielefeldEvents, selectedCategory, dateFilter]);

  // Geocoding function
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

  // Create custom marker icon based on popularity
  const createCustomIcon = (event: any) => {
    const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
    let color = '#22c55e';
    let size = 20;

    if (popularity >= 20) {
      color = '#ef4444';
      size = 30;
    } else if (popularity >= 10) {
      color = '#f97316';
      size = 26;
    } else if (popularity >= 5) {
      color = '#eab308';
      size = 23;
    }

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Geocode events when they change
  useEffect(() => {
    const geocodeEvents = async () => {
      const newCoordinates: EventCoordinates = {};
      
      for (const event of bielefeldEvents) {
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

    if (bielefeldEvents.length > 0) {
      geocodeEvents();
    }
  }, [bielefeldEvents, eventCoordinates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl mb-2">Lade Events...</h2>
          <p className="text-gray-400">Bitte warten Sie einen Moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Card className="p-4 bg-black/90 backdrop-blur border-gray-700">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Event Heatmap Bielefeld
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-xs px-3 py-1 rounded-full ${
                  selectedCategory === category
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? 'Alle Kategorien' : category}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white text-xs py-1 px-2 rounded w-40"
            />
            {dateFilter && (
              <Button
                onClick={() => setDateFilter('')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-4 bg-black/90 backdrop-blur border-gray-700 text-white text-sm">
          <h4 className="font-bold mb-2">Legende:</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#ef4444] border-2 border-white"></span>
              <span>Sehr beliebt (20+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#f97316] border-2 border-white"></span>
              <span>Beliebt (10-19)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#eab308] border-2 border-white"></span>
              <span>Moderat (5-9)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white"></span>
              <span>Neu/Gering (0-4)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <MapContainer
        center={[52.0302, 8.5311]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredEvents
          .filter(event => eventCoordinates[event.id])
          .map((event) => {
            const coordinates = eventCoordinates[event.id];
            const customIcon = createCustomIcon(event);
            const participants = event.rsvp_yes || 0;
            const likes = event.likes || 0;

            return (
              <Marker 
                key={event.id} 
                position={coordinates} 
                icon={customIcon}
              >
                <Popup>
                  <div className="p-3 min-w-[250px]">
                    <h3 className="font-bold text-lg mb-2 text-red-600">{event.title}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{new Date(event.date).toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{participants} Teilnehmer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>❤️</span>
                        <span>{likes} Likes</span>
                      </div>
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          {event.category}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-2 text-gray-600 text-xs">
                          {event.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        }
      </MapContainer>
    </div>
  );
};

export default EventHeatmap;
