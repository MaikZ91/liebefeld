
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin, Calendar, Users, Clock, ChevronDown } from 'lucide-react';
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
  const [timeRange, setTimeRange] = useState([0]); // 0-23 hours
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Convert hour slider value to time string
  const getTimeFromSlider = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Convert time string to hour number
  const getHourFromTime = (timeString: string): number => {
    const [hour] = timeString.split(':');
    return parseInt(hour, 10);
  };

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
        attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0),
        eventHour: getHourFromTime(event.time)
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

    // Add some random offset for unmapped locations
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

  // Filter events based on selected category and time
  const filteredEvents = React.useMemo(() => {
    let filtered = todaysBielefeldEvents;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    // Filter by time - show events at or after the selected hour
    const selectedHour = timeRange[0];
    filtered = filtered.filter(event => event.eventHour >= selectedHour);
    
    return filtered;
  }, [todaysBielefeldEvents, selectedCategory, timeRange]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing Leaflet Map...');
    
    try {
      const leafletMap = L.map(mapRef.current, {
        center: [52.0302, 8.5311], // Bielefeld center
        zoom: 13,
        zoomControl: true,
        preferCanvas: false
      });
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      setMap(leafletMap);
      console.log('Map initialized successfully');

      // Cleanup function
      return () => {
        if (leafletMap) {
          leafletMap.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapRef.current]);

  // Update markers when filtered events change
  useEffect(() => {
    if (!map) return;

    console.log('Updating markers for', filteredEvents.length, 'events');

    // Clear existing markers
    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    // Create new markers for filtered events
    const newMarkers: L.Marker[] = [];

    filteredEvents.forEach(event => {
      try {
        const displayNumber = event.attendees > 0 ? event.attendees : (event.likes || 1);
        
        // Create custom marker icon
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

        // Create popup content
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
  }, [map, filteredEvents]);

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

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
  const selectedCategoryDisplay = selectedCategory === 'all' ? 'Alle' : selectedCategory;

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-sm">
        <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Events heute in Bielefeld
          </h3>
          
          <div className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  >
                    {selectedCategoryDisplay} ({selectedCategoryData?.count || 0})
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                    >
                      {category.name === 'all' ? 'Alle' : category.name} ({category.count})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Time Slider */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white text-sm">
                <Clock className="w-4 h-4 text-red-500" />
                <span>Zeit: ab {getTimeFromSlider(timeRange[0])} Uhr</span>
              </div>
              <Slider
                value={timeRange}
                onValueChange={setTimeRange}
                max={23}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-3 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              {filteredEvents.length} Events ab {getTimeFromSlider(timeRange[0])} Uhr
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              {filteredEvents.reduce((sum, event) => sum + event.attendees, 0)} Interessierte
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-red-500">❤️</span>
              {filteredEvents.reduce((sum, event) => sum + (event.likes || 0), 0)} Likes
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ 
          minHeight: '100vh',
          zIndex: 1
        }}
      />
    </div>
  );
};

export default EventHeatmap;
