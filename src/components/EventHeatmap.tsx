
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, MapPin, Calendar, Users } from 'lucide-react';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Sample event locations in Bielefeld
const sampleEventLocations = [
  { 
    id: '1', 
    title: 'Konzert im Forum', 
    lat: 52.0210, 
    lng: 8.5320, 
    category: 'Konzert',
    attendees: 45,
    date: '2025-01-15',
    location: 'Forum Bielefeld'
  },
  { 
    id: '2', 
    title: 'Stadtfest Altstadt', 
    lat: 52.0192, 
    lng: 8.5370, 
    category: 'Festival',
    attendees: 120,
    date: '2025-01-20',
    location: 'Bielefeld Altstadt'
  },
  { 
    id: '3', 
    title: 'Theater Premiere', 
    lat: 52.0185, 
    lng: 8.5355, 
    category: 'Theater',
    attendees: 67,
    date: '2025-01-18',
    location: 'Theater Bielefeld'
  },
  { 
    id: '4', 
    title: 'Uni Sportevent', 
    lat: 52.0380, 
    lng: 8.4950, 
    category: 'Sport',
    attendees: 89,
    date: '2025-01-22',
    location: 'Universität Bielefeld'
  },
  { 
    id: '5', 
    title: 'Lokschuppen Party', 
    lat: 52.0195, 
    lng: 8.5340, 
    category: 'Party',
    attendees: 156,
    date: '2025-01-25',
    location: 'Lokschuppen'
  },
  { 
    id: '6', 
    title: 'Kunstausstellung', 
    lat: 52.0175, 
    lng: 8.5380, 
    category: 'Ausstellung',
    attendees: 34,
    date: '2025-01-28',
    location: 'Kunsthalle Bielefeld'
  }
];

const EventHeatmap: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get categories with counts
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    sampleEventLocations.forEach(event => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: sampleEventLocations.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
  }, []);

  // Filter events based on selected category and date
  const filteredEvents = React.useMemo(() => {
    let filtered = sampleEventLocations;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(event => event.date === dateFilter);
    }
    
    return filtered;
  }, [selectedCategory, dateFilter]);

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

    console.log('Updating markers for', filteredEvents.length, 'events');

    // Clear existing markers
    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    // Create new markers for filtered events
    const newMarkers: L.Marker[] = [];

    filteredEvents.forEach(event => {
      try {
        // Create custom icon with attendee count
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
            ${event.attendees}
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

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${event.title}</h3>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📍</span>
              <span>${event.location}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📅</span>
              <span>${new Date(event.date).toLocaleDateString('de-DE')}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280;">
              <span style="margin-right: 8px;">👥</span>
              <span>${event.attendees} Teilnehmer</span>
            </div>
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

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-sm">
        <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Event-Karte Bielefeld
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
              {filteredEvents.length} Events gefiltert
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              {filteredEvents.reduce((sum, event) => sum + event.attendees, 0)} Teilnehmer gesamt
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
