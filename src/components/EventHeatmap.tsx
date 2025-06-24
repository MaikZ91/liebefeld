import React, { useEffect, useState, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Filter, X, MapPin, Zap } from 'lucide-react';
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
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
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

  // Initialize map with enhanced styling
  useEffect(() => {
    if (!mapRef.current || map) return;

    const leafletMap = L.map(mapRef.current, {
      zoomControl: false
    }).setView([52.0302, 8.5311], 13);
    
    // Custom dark tile layer for better visibility
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(leafletMap);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(leafletMap);

    setMap(leafletMap);

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

  // Enhanced marker creation with popularity-based styling
  const createCustomIcon = (event: any) => {
    const popularity = (event.likes || 0) + (event.rsvp_yes || 0) * 0.5;
    let color = '#22c55e';
    let size = 16;
    let pulse = '';

    if (popularity >= 20) {
      color = '#ef4444';
      size = 24;
      pulse = 'animation: pulse 2s infinite;';
    } else if (popularity >= 10) {
      color = '#f97316';
      size = 20;
    } else if (popularity >= 5) {
      color = '#eab308';
      size = 18;
    }

    // Add category-specific styling
    const categoryColors: { [key: string]: string } = {
      'Konzert': '#8b5cf6',
      'Party': '#ec4899',
      'Sport': '#10b981',
      'Workshop': '#3b82f6',
      'Kultur': '#f59e0b'
    };

    if (popularity < 5 && categoryColors[event.category]) {
      color = categoryColors[event.category];
    }

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ${pulse}
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: ${Math.max(8, size * 0.4)}px;
          font-weight: bold;
        ">${popularity >= 1 ? Math.round(popularity) : '·'}</div>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Batch geocoding with progress tracking
  useEffect(() => {
    const geocodeEvents = async () => {
      const eventsToGeocode = bielefeldEvents.filter(event => 
        event.location && !eventCoordinates[event.id]
      );
      
      if (eventsToGeocode.length === 0) return;

      setIsGeocodingInProgress(true);
      const newCoordinates: EventCoordinates = { ...eventCoordinates };
      
      for (let i = 0; i < eventsToGeocode.length; i++) {
        const event = eventsToGeocode[i];
        try {
          const coords = await geocodeAddress(event.location);
          if (coords) {
            newCoordinates[event.id] = coords;
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
    };

    if (bielefeldEvents.length > 0) {
      geocodeEvents();
    }
  }, [bielefeldEvents, eventCoordinates]);

  // Enhanced marker management with clustering
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    setMarkers([]);

    const newMarkers: L.Marker[] = [];

    filteredEvents
      .filter(event => eventCoordinates[event.id])
      .forEach((event) => {
        const coordinates = eventCoordinates[event.id];
        const customIcon = createCustomIcon(event);
        const participants = event.rsvp_yes || 0;
        const likes = event.likes || 0;

        const marker = L.marker(coordinates, { icon: customIcon });
        
        // Enhanced popup with better formatting
        const popupContent = `
          <div style="padding: 16px; min-width: 280px; max-width: 320px;">
            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #dc2626; line-height: 1.3;">${event.title}</h3>
            <div style="font-size: 14px; line-height: 1.5;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">📅</span>
                <span style="font-weight: 500;">${new Date(event.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">🕐</span>
                <span>${event.time}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">📍</span>
                <span style="color: #666;">${event.location}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 16px; margin: 12px 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 16px;">👥</span>
                  <span style="font-weight: 500;">${participants}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 16px;">❤️</span>
                  <span style="font-weight: 500;">${likes}</span>
                </div>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="padding: 6px 12px; background-color: #dc2626; color: white; font-size: 12px; border-radius: 16px; font-weight: 500;">
                  ${event.category}
                </span>
              </div>
              ${event.description ? `
                <p style="margin-top: 12px; color: #666; font-size: 13px; line-height: 1.4; border-top: 1px solid #eee; padding-top: 8px;">
                  ${event.description.length > 120 ? event.description.substring(0, 120) + '...' : event.description}
                </p>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 350,
          className: 'custom-popup'
        });
        marker.addTo(map);
        newMarkers.push(marker);
      });

    setMarkers(newMarkers);
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

        {/* Enhanced Legend */}
        <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm shadow-xl">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Popularitäts-Legende:
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#ef4444] border-2 border-white flex items-center justify-center text-xs font-bold animate-pulse">20</span>
              <span>Sehr beliebt (20+)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-[#f97316] border-2 border-white flex items-center justify-center text-xs font-bold">10</span>
              <span>Beliebt (10-19)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#eab308] border-2 border-white flex items-center justify-center text-xs">5</span>
              <span>Moderat (5-9)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white flex items-center justify-center text-xs">·</span>
              <span>Neu/Gering (0-4)</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400">
              📊 {filteredEvents.length} Events angezeigt
              <br />
              🗺️ {Object.keys(eventCoordinates).length} Standorte geladen
            </p>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Custom CSS for enhanced styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-popup .leaflet-popup-content-wrapper {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          }
          .custom-popup .leaflet-popup-tip {
            background: white;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `
      }} />
    </div>
  );
};

export default EventHeatmap;
