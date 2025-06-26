
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, MapPin, Calendar, Users } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';

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
  const [dateFilter, setDateFilter] = useState('');
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Filter events for Bielefeld and get coordinates
  const bielefeldEvents = React.useMemo(() => {
    return events
      .filter(event => 
        event.city?.toLowerCase().includes('bielefeld') || 
        event.location?.toLowerCase().includes('bielefeld') ||
        !event.city // Include events without specific city as they might be local
      )
      .map(event => ({
        ...event,
        // Add coordinates for Bielefeld locations (you might want to use a geocoding service for real coordinates)
        lat: getCoordinatesForLocation(event.location || event.title),
        lng: getCoordinatesForLocation(event.location || event.title, true),
        attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0)
      }))
      .filter(event => event.lat && event.lng); // Only include events with coordinates
  }, [events]);

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
    const offset = (Math.random() - 0.5) * 0.02; // Small random offset within ~1km
    return isLng ? bielefeldCenter.lng + offset : bielefeldCenter.lat + offset;
  }

  // Get categories with counts from real data
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    bielefeldEvents.forEach(event => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: bielefeldEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
  }, [bielefeldEvents]);

  // Filter events based on selected category and date
  const filteredEvents = React.useMemo(() => {
    let filtered = bielefeldEvents;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(event => event.date === dateFilter);
    }
    
    return filtered;
  }, [bielefeldEvents, selectedCategory, dateFilter]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing Bielefeld Map...');
    
    try {
      // Create map centered on Bielefeld
      const leafletMap = L.map(mapRef.current, {
        center: [52.0302, 8.5311], // Bielefeld coordinates
        zoom: 13,
        zoomControl: true
      });
      
      // Add OpenStreetMap tiles
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

    console.log('Updating markers for', filteredEvents.length, 'Bielefeld events');

    // Clear existing markers
    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    // Create new markers for filtered events
    const newMarkers: L.Marker[] = [];

    filteredEvents.forEach(event => {
      try {
        // Create custom icon with attendee count or likes
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

        // Create marker
        const marker = L.marker([event.lat, event.lng], { icon: customIcon });

        // Create popup content with real data
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${event.title}</h3>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📍</span>
              <span>${event.location || 'Bielefeld'}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📅</span>
              <span>${new Date(event.date).toLocaleDateString('de-DE')}</span>
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
          <p className="text-gray-400">Bielefeld Events werden geladen...</p>
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
            Events in Bielefeld
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
            
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white text-xs"
                placeholder="Datum filtern"
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
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-3 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              {filteredEvents.length} Events in Bielefeld
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

      {/* Map Container */}
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
