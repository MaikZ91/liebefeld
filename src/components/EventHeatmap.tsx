
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

    return () => {
      leafletMap.remove();
    };
  }, [map]);

  // Enhanced geocoding with caching and rate limiting
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    // Simple cache check
    const cached = localStorage.getItem(`geocache_${address}`);
    if (cached) {
      const coords = JSON.parse(cached);
      return [parseFloat(coords.lat), parseFloat(coords.lon)];
    }

    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Bielefeld, Germany')}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        // Cache the result
        localStorage.setItem(`geocache_${address}`, JSON.stringify({ lat: data[0].lat, lon: data[0].lon }));
        return coords as [number, number];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Batch geocoding with progress tracking
  useEffect(() => {
    const geocodeEvents = async () => {
      const eventsToGeocode = bielefeldEvents.filter(event => 
        event.location && !eventCoordinates[event.id]
      );
      
      if (eventsToGeocode.length === 0) return;

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
        
        // Update progress
        if (i % 3 === 0) { // Update every 3 events to avoid too many renders
          setEventCoordinates({ ...newCoordinates });
        }
      }
      
      setEventCoordinates(newCoordinates);
      setIsGeocodingInProgress(false);
      console.log(`Geocoding completed. Total coordinates: ${Object.keys(newCoordinates).length}`);
    };

    if (bielefeldEvents.length > 0) {
      geocodeEvents();
    }
  }, [bielefeldEvents, eventCoordinates]);

  // Create heatmap layer
  useEffect(() => {
    if (!map) return;

    console.log('Creating heatmap layer...');
    
    // Remove existing heat layer
    if (heatLayer) {
      map.removeLayer(heatLayer);
      console.log('Removed existing heatmap layer');
    }

    // Prepare heatmap data: [latitude, longitude, intensity]
    const heatmapData: [number, number, number][] = filteredEvents
      .filter(event => eventCoordinates[event.id])
      .map((event) => {
        const coordinates = eventCoordinates[event.id];
        // Calculate intensity based on likes, RSVP, and recency
        const likes = event.likes || 0;
        const rsvp = (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) * 0.5;
        const baseIntensity = Math.max(0.3, likes * 0.1 + rsvp * 0.2);
        
        // Boost intensity for recent events
        const eventDate = new Date(event.date);
        const now = new Date();
        const daysDiff = Math.abs((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        const recencyBoost = daysDiff <= 7 ? 2.0 : daysDiff <= 30 ? 1.5 : 1.0;
        
        const intensity = Math.min(1.0, baseIntensity * recencyBoost);
        
        return [coordinates[0], coordinates[1], intensity];
      });

    console.log(`Heatmap data prepared: ${heatmapData.length} points`);
    console.log('Sample heatmap data:', heatmapData.slice(0, 3));

    if (heatmapData.length > 0) {
      try {
        // Create heat layer with custom options
        const newHeatLayer = (L as any).heatLayer(heatmapData, {
          radius: 30,
          blur: 20,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.4,
          gradient: {
            0.0: '#313695',
            0.1: '#4575b4',
            0.2: '#74add1',
            0.3: '#abd9e9',
            0.4: '#e0f3f8',
            0.5: '#ffffcc',
            0.6: '#fee090',
            0.7: '#fdae61',
            0.8: '#f46d43',
            0.9: '#d73027',
            1.0: '#a50026'
          }
        });

        newHeatLayer.addTo(map);
        setHeatLayer(newHeatLayer);
        console.log('Heatmap layer added successfully');
      } catch (error) {
        console.error('Error creating heatmap layer:', error);
      }
    } else {
      console.log('No heatmap data available');
    }

    // Add individual markers for detailed view at high zoom levels
    const markers: L.Marker[] = [];
    
    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      
      if (zoom >= 15) {
        // Show individual markers at high zoom
        filteredEvents
          .filter(event => eventCoordinates[event.id])
          .forEach((event) => {
            const coordinates = eventCoordinates[event.id];
            
            const marker = L.marker(coordinates).addTo(map);
            
            const popupContent = `
              <div style="padding: 12px; min-width: 240px;">
                <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #dc2626;">${event.title}</h3>
                <div style="font-size: 13px; line-height: 1.4;">
                  <div style="margin-bottom: 4px;">📅 ${new Date(event.date).toLocaleDateString('de-DE')}</div>
                  <div style="margin-bottom: 4px;">🕐 ${event.time}</div>
                  <div style="margin-bottom: 4px;">📍 ${event.location}</div>
                  <div style="margin-bottom: 4px;">🏷️ ${event.category}</div>
                  <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <span>👥 ${event.rsvp_yes || 0}</span>
                    <span>❤️ ${event.likes || 0}</span>
                  </div>
                </div>
              </div>
            `;

            marker.bindPopup(popupContent, { maxWidth: 280 });
            markers.push(marker);
          });
      } else {
        // Remove individual markers at low zoom
        markers.forEach(marker => map.removeLayer(marker));
        markers.length = 0;
      }
    };

    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
      markers.forEach(marker => map.removeLayer(marker));
    };

  }, [map, filteredEvents, eventCoordinates]);

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
      {/* Enhanced Filter Panel */}
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
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
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
                className="bg-gray-800 border-gray-600 text-white text-xs py-2 px-3 rounded flex-1"
              />
              {dateFilter && (
                <Button
                  onClick={() => setDateFilter('')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-1"
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

        {/* Heatmap Legend */}
        <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm shadow-xl">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Heatmap Intensität:
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Niedrig</span>
              <div className="w-16 h-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <span>Mittel</span>
              <div className="w-16 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <span>Hoch</span>
              <div className="w-16 h-3 bg-gradient-to-r from-red-500 to-red-700 rounded"></div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400">
              📊 {filteredEvents.length} Events angezeigt
              <br />
              🗺️ {Object.keys(eventCoordinates).length} Standorte geladen
              <br />
              🔍 Zoom rein für Details
            </p>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default EventHeatmap;
