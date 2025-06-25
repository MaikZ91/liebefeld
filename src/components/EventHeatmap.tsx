
import React, { useEffect, useState, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Filter, X, MapPin, Zap } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';

// Import leaflet.heat plugin
import 'leaflet.heat';

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
  const [map, setMap] = useState<L.Map | null>(null);
  const [heatLayer, setHeatLayer] = useState<any>(null);
  const [isGeocodingInProgress, setIsGeocodingInProgress] = useState(false);
  const [geocodingComplete, setGeocodingComplete] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { events, isLoading } = useEvents();

  // Filter events for Bielefeld with improved logic
  const bielefeldEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (event) => !event.city || 
        event.city.toLowerCase().includes('bielefeld') || 
        event.city.toLowerCase() === 'bi' ||
        event.location?.toLowerCase().includes('bielefeld')
    );
  }, [events]);

  // Get unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const categoryMap = new Map<string, number>();
    bielefeldEvents.forEach(event => {
      const category = event.category || 'Sonstiges';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: bielefeldEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing map...');
    try {
      const leafletMap = L.map(mapRef.current, {
        zoomControl: false
      }).setView([52.0302, 8.5311], 13);
      
      // Use OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      // Add zoom control to bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(leafletMap);

      setMap(leafletMap);
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Map initialization error:', error);
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Geocoding with better error handling and rate limiting
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    // Check cache first
    const cacheKey = `geocache_${address.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const coords = JSON.parse(cached);
        return [parseFloat(coords.lat), parseFloat(coords.lon)];
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const searchQuery = `${address}, Bielefeld, Germany`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'THE TRIBE.BI Event Heatmap (contact: support@the-tribe.bi)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        // Verify coordinates are within reasonable bounds for Bielefeld
        if (coords[0] >= 51.8 && coords[0] <= 52.2 && coords[1] >= 8.3 && coords[1] <= 8.7) {
          localStorage.setItem(cacheKey, JSON.stringify({ lat: data[0].lat, lon: data[0].lon }));
          return coords;
        }
      }
    } catch (error) {
      console.error('Geocoding error for', address, ':', error);
    }
    return null;
  };

  // Improved geocoding with better state management
  useEffect(() => {
    if (geocodingComplete || isGeocodingInProgress || bielefeldEvents.length === 0) {
      return;
    }

    const geocodeEvents = async () => {
      const eventsToGeocode = bielefeldEvents
        .filter(event => event.location && !eventCoordinates[event.id])
        .slice(0, 50); // Limit to first 50 events to avoid overwhelming the API
      
      if (eventsToGeocode.length === 0) {
        setGeocodingComplete(true);
        return;
      }

      console.log(`Starting geocoding for ${eventsToGeocode.length} events...`);
      setIsGeocodingInProgress(true);
      const newCoordinates: EventCoordinates = { ...eventCoordinates };
      
      for (let i = 0; i < eventsToGeocode.length; i++) {
        const event = eventsToGeocode[i];
        try {
          const coords = await geocodeAddress(event.location);
          if (coords) {
            newCoordinates[event.id] = coords;
            console.log(`Geocoded event: ${event.title} -> ${coords[0]}, ${coords[1]}`);
          }
        } catch (error) {
          console.error(`Failed to geocode ${event.title}:`, error);
        }
        
        // Update coordinates periodically
        if (i % 5 === 0 && i > 0) {
          setEventCoordinates({ ...newCoordinates });
        }
      }
      
      setEventCoordinates(newCoordinates);
      setIsGeocodingInProgress(false);
      setGeocodingComplete(true);
      console.log(`Geocoding completed. Total coordinates: ${Object.keys(newCoordinates).length}`);
    };

    geocodeEvents();
  }, [bielefeldEvents.length, geocodingComplete, isGeocodingInProgress]);

  // Sample coordinates for immediate testing
  const sampleCoordinates = useMemo(() => {
    const samples: [number, number, number][] = [
      [52.0302, 8.5311, 0.8], // Bielefeld center
      [52.0192, 8.5370, 0.6], // Old Town
      [52.0380, 8.4950, 0.7], // University area
      [52.0250, 8.5200, 0.5], // Kesselbrink
      [52.0420, 8.5100, 0.9], // Sennestadt
    ];
    return samples;
  }, []);

  // Create heatmap layer
  useEffect(() => {
    if (!map) return;

    console.log('Creating heatmap layer...');
    
    // Remove existing heat layer
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }

    // Prepare heatmap data from actual events
    const eventHeatmapData: [number, number, number][] = filteredEvents
      .filter(event => eventCoordinates[event.id])
      .map((event) => {
        const coordinates = eventCoordinates[event.id];
        const likes = event.likes || 0;
        const rsvp = (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) * 0.5;
        const intensity = Math.max(0.3, Math.min(1.0, likes * 0.1 + rsvp * 0.2));
        return [coordinates[0], coordinates[1], intensity];
      });

    // Use sample data if no geocoded events yet
    const heatmapData = eventHeatmapData.length > 0 ? eventHeatmapData : sampleCoordinates;

    console.log(`Heatmap data prepared: ${heatmapData.length} points`);

    if (heatmapData.length > 0) {
      try {
        // Create heat layer
        const newHeatLayer = (L as any).heatLayer(heatmapData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.3,
          gradient: {
            0.0: '#0000ff',
            0.2: '#00ffff', 
            0.4: '#00ff00',
            0.6: '#ffff00',
            0.8: '#ff8000',
            1.0: '#ff0000'
          }
        });

        newHeatLayer.addTo(map);
        setHeatLayer(newHeatLayer);
        console.log('Heatmap layer added successfully');
      } catch (error) {
        console.error('Error creating heatmap layer:', error);
      }
    }

    // Add individual markers for high zoom levels
    const addMarkers = () => {
      const zoom = map.getZoom();
      if (zoom >= 15) {
        filteredEvents
          .filter(event => eventCoordinates[event.id])
          .forEach((event) => {
            const coordinates = eventCoordinates[event.id];
            const marker = L.marker(coordinates).addTo(map);
            
            const popupContent = `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 6px;">${event.title}</h3>
                <div style="font-size: 12px;">
                  <div>📅 ${new Date(event.date).toLocaleDateString('de-DE')}</div>
                  <div>🕐 ${event.time}</div>
                  <div>📍 ${event.location}</div>
                </div>
              </div>
            `;

            marker.bindPopup(popupContent);
          });
      }
    };

    map.on('zoomend', addMarkers);

    return () => {
      if (map) {
        map.off('zoomend', addMarkers);
      }
    };

  }, [map, filteredEvents, eventCoordinates, heatLayer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce text-red-500" />
          <h2 className="text-xl mb-2">Lade Event-Heatmap...</h2>
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
            <Zap className="w-5 h-5 text-red-500" />
            Event Heatmap Bielefeld
          </h3>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {categoriesWithCounts.map((category) => (
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
          
          {isGeocodingInProgress && (
            <div className="mt-3 text-xs text-yellow-400 animate-pulse">
              🗺️ Standorte werden geladen...
            </div>
          )}
        </Card>

        {/* Stats */}
        <Card className="p-3 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm">
          <div className="space-y-1">
            <div>📊 {filteredEvents.length} Events angezeigt</div>
            <div>🗺️ {Object.keys(eventCoordinates).length} Standorte</div>
            <div>🔍 Zoom rein für Details</div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ background: '#f0f0f0' }}
      />
    </div>
  );
};

export default EventHeatmap;
