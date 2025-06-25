
import React, { useEffect, useState, useRef } from 'react';
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

const EventHeatmap: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [map, setMap] = useState<L.Map | null>(null);
  const [heatLayer, setHeatLayer] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { events, isLoading } = useEvents();

  // Sample heatmap data for Bielefeld (real coordinates)
  const sampleBielefeldHeatmapData: [number, number, number][] = [
    // City Center
    [52.0302, 8.5311, 1.0], // Bielefeld Hauptbahnhof
    [52.0192, 8.5370, 0.9], // Altstadt
    [52.0220, 8.5280, 0.8], // Kesselbrink
    [52.0180, 8.5330, 0.7], // Niederwall
    
    // University Area
    [52.0380, 8.4950, 0.9], // Universität Bielefeld
    [52.0420, 8.4900, 0.6], // Campus Nähe
    
    // Districts
    [52.0420, 8.5100, 0.8], // Sennestadt
    [52.0150, 8.5200, 0.7], // Mitte-West
    [52.0280, 8.5450, 0.6], // Brackwede
    [52.0080, 8.5100, 0.5], // Schildesche
    
    // Event Locations
    [52.0210, 8.5320, 0.9], // Forum Bielefeld
    [52.0185, 8.5355, 0.8], // Theater Bielefeld
    [52.0195, 8.5340, 0.7], // Lokschuppen
    [52.0175, 8.5380, 0.6], // Bunker Ulmenwall
    [52.0230, 8.5290, 0.8], // Ravensberger Park
    
    // Nightlife
    [52.0200, 8.5350, 0.9], // Altstadt Kneipen
    [52.0190, 8.5360, 0.8], // Goldschmiede
    [52.0185, 8.5345, 0.7], // Club Area
  ];

  // Filter events for Bielefeld
  const bielefeldEvents = events?.filter(
    (event) => !event.city || 
      event.city.toLowerCase().includes('bielefeld') || 
      event.city.toLowerCase() === 'bi' ||
      event.location?.toLowerCase().includes('bielefeld')
  ) || [];

  // Get unique categories with counts
  const categoriesWithCounts = React.useMemo(() => {
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
  const filteredEvents = React.useMemo(() => {
    return bielefeldEvents.filter((event) => {
      const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
      const dateMatch = !dateFilter || event.date === dateFilter;
      return categoryMatch && dateMatch;
    });
  }, [bielefeldEvents, selectedCategory, dateFilter]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing Bielefeld Event Heatmap...');
    
    try {
      // Create map centered on Bielefeld
      const leafletMap = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView([52.0302, 8.5311], 12); // Bielefeld coordinates
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 10
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
        console.log('Cleaning up map...');
        map.remove();
      }
    };
  }, []);

  // Create and update heatmap layer
  useEffect(() => {
    if (!map) return;

    console.log('Creating heatmap layer...');
    
    // Remove existing heat layer
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }

    try {
      // Create heat layer with sample data
      const newHeatLayer = (L as any).heatLayer(sampleBielefeldHeatmapData, {
        radius: 30,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.0: '#0000ff',  // Blue (low activity)
          0.2: '#00ffff',  // Cyan
          0.4: '#00ff00',  // Green
          0.6: '#ffff00',  // Yellow
          0.8: '#ff8000',  // Orange
          1.0: '#ff0000'   // Red (high activity)
        }
      });

      newHeatLayer.addTo(map);
      setHeatLayer(newHeatLayer);
      console.log('Heatmap layer added successfully with', sampleBielefeldHeatmapData.length, 'data points');
      
    } catch (error) {
      console.error('Error creating heatmap layer:', error);
    }

  }, [map, filteredEvents]);

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
        </Card>

        {/* Stats */}
        <Card className="p-3 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm">
          <div className="space-y-1">
            <div>📊 {filteredEvents.length} Events gefiltert</div>
            <div>🗺️ {sampleBielefeldHeatmapData.length} Heatmap-Punkte</div>
            <div>🔥 Heatmap zeigt Event-Hotspots</div>
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
