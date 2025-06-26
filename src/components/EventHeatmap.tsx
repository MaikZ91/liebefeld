
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, MapPin, Calendar, Users } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventHeatmap: React.FC = () => {
  const { events, isLoading } = useEvents();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Filter events for Bielefeld and today only
  const todaysBielefeldEvents = React.useMemo(() => {
    console.log(`Filtering events for today (${today}) in Bielefeld...`);
    
    const filtered = events
      .filter(event => {
        const isToday = event.date === today;
        const isBielefeld = event.city?.toLowerCase().includes('bielefeld') || 
                           event.location?.toLowerCase().includes('bielefeld') ||
                           !event.city; // Include events without specific city
        
        console.log(`Event: ${event.title}, Date: ${event.date}, City: ${event.city}, IsToday: ${isToday}, IsBielefeld: ${isBielefeld}`);
        return isToday && isBielefeld;
      })
      .map(event => ({
        ...event,
        lat: getCoordinatesForLocation(event.location || event.title),
        lng: getCoordinatesForLocation(event.location || event.title, true),
        attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0)
      }))
      .filter(event => event.lat && event.lng);

    console.log(`Found ${filtered.length} events for today in Bielefeld`);
    return filtered;
  }, [events, today]);

  // Simple coordinate mapping for Bielefeld locations
  function getCoordinatesForLocation(location: string, isLng: boolean = false): number {
    const locationLower = location.toLowerCase();
    
    // Bielefeld center coordinates as default
    const bielefeldCenter = { lat: 52.0302, lng: 8.5311 };
    
    // Map common locations to approximate coordinates
    const locationMap: { [key: string]: { lat: number; lng: number } } = {
      'forum': { lat: 52.0210, lng: 8.5320 },
      'altstadt': { lat: 52.0192, lng: 8.5370 },
      'theater': { lat: 52.0185, lng: 8.5355 },
      'universität': { lat: 52.0380, lng: 8.4950 },
      'uni': { lat: 52.0380, lng: 8.4950 },
      'lokschuppen': { lat: 52.0195, lng: 8.5340 },
      'kunsthalle': { lat: 52.0175, lng: 8.5380 },
      'stadtpark': { lat: 52.0250, lng: 8.5280 },
      'zentrum': { lat: 52.0302, lng: 8.5311 },
      'stadthalle': { lat: 52.0220, lng: 8.5400 },
      'bielefeld': bielefeldCenter
    };

    // Find matching location
    for (const [key, coords] of Object.entries(locationMap)) {
      if (locationLower.includes(key)) {
        return isLng ? coords.lng : coords.lat;
      }
    }

    // Add some random offset to center for unmapped locations
    const offset = (Math.random() - 0.5) * 0.02;
    return isLng ? bielefeldCenter.lng + offset : bielefeldCenter.lat + offset;
  }

  // Get categories with counts from today's events
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    todaysBielefeldEvents.forEach(event => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: todaysBielefeldEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
  }, [todaysBielefeldEvents]);

  // Filter events based on selected category
  const filteredEvents = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return todaysBielefeldEvents;
    }
    return todaysBielefeldEvents.filter(event => event.category === selectedCategory);
  }, [todaysBielefeldEvents, selectedCategory]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing Bielefeld Map...');
    
    try {
      const leafletMap = L.map(mapRef.current, {
        center: [52.0302, 8.5311],
        zoom: 13,
        zoomControl: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      setMap(leafletMap);
      setIsMapLoaded(true);
      console.log('Map initialized successfully');

      return () => {
        if (leafletMap) {
          leafletMap.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Update markers when filtered events change
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    console.log('Updating markers for', filteredEvents.length, "today's Bielefeld events");

    // Clear existing markers
    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    // Create new markers for filtered events
    const newMarkers: L.Marker[] = [];

    filteredEvents.forEach(event => {
      try {
        const displayNumber = event.attendees > 0 ? event.attendees : (event.likes || 1);
        const iconHtml = `
          <div style="
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${displayNumber}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        const marker = L.marker([event.lat, event.lng], { icon: customIcon });

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${event.title}</h3>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📍</span>
              <span>${event.location || 'Bielefeld'}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📅</span>
              <span>Heute</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">⏰</span>
              <span>${event.time}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">👥</span>
              <span>${event.rsvp_yes || 0} Zusagen, ${event.rsvp_maybe || 0} Vielleicht</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280;">
              <span style="margin-right: 8px;">❤️</span>
              <span>${event.likes || 0} Likes</span>
            </div>
            ${event.description ? `<p style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">${event.description}</p>` : ''}
            <div style="
              background: #ef4444;
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              display: inline-block;
            ">
              ${event.category}
            </div>
            ${event.link ? `<div style="margin-top: 8px;"><a href="${event.link}" target="_blank" style="color: #ef4444; text-decoration: underline;">Mehr Info</a></div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        newMarkers.push(marker);
      } catch (error) {
        console.error('Error creating marker for event:', event.title, error);
      }
    });

    setMarkers(newMarkers);
  }, [map, filteredEvents, isMapLoaded]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce text-red-500" />
          <h2 className="text-xl mb-2">Lade Events...</h2>
          <p className="text-gray-400">Heutige Events in Bielefeld werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-sm">
        <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Events heute in Bielefeld
          </h3>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === category.name
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.name === 'all' ? 'Alle' : category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-3 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              {filteredEvents.length} Events heute in Bielefeld
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              {filteredEvents.reduce((sum, event) => sum + event.attendees, 0)} Interessierte gesamt
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-red-500">❤️</span>
              {filteredEvents.reduce((sum, event) => sum + (event.likes || 0), 0)} Likes gesamt
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container - This is the main focus */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ 
          background: '#f0f0f0',
          minHeight: '100vh'
        }}
      />

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[2000]">
          <div className="text-center text-white">
            <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce text-red-500" />
            <h2 className="text-xl mb-2">Lade Karte...</h2>
            <p className="text-gray-400">OpenStreetMap wird geladen...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventHeatmap;
