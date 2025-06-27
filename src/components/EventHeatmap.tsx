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
  // Set the initial timeRange to the current hour
  const [timeRange, setTimeRange] = useState([new Date().getHours()]); 
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

  // Enhanced coordinate mapping using real location data
  function getCoordinatesForLocation(location: string, isLng: boolean = false): number | null {
    if (!location) return null;
    
    const locationLower = location.toLowerCase();
    
    // Bielefeld center coordinates as default
    const bielefeldCenter = { lat: 52.0302, lng: 8.5311 };
    
    // Enhanced location mapping with real coordinates for Bielefeld
    const locationMap: { [key: string]: { lat: number; lng: number } } = {
      // Cultural venues
      'forum': { lat: 52.0210, lng: 8.5320 },
      'lokschuppen': { lat: 52.0195, lng: 8.5340 },
      'kunsthalle': { lat: 52.0175, lng: 8.5380 },
      'theater': { lat: 52.0185, lng: 8.5355 },
      'stadttheater': { lat: 52.0185, lng: 8.5355 },
      'stadthalle': { lat: 52.0220, lng: 8.5400 },
      'rudolf-oetker-halle': { lat: 52.0210, lng: 8.5330 },
      'stereo bielefeld': { lat: 52.0200, lng: 8.5350 },
      'stereo': { lat: 52.0200, lng: 8.5350 },
      'nr.z.p': { lat: 52.0190, lng: 8.5370 },
      'nrzp': { lat: 52.0190, lng: 8.5370 },
      
      // University area
      'universität': { lat: 52.0380, lng: 8.4950 },
      'uni': { lat: 52.0380, lng: 8.4950 },
      'campus': { lat: 52.0380, lng: 8.4950 },
      
      // City districts
      'altstadt': { lat: 52.0192, lng: 8.5370 },
      'zentrum': { lat: 52.0302, lng: 8.5311 },
      'innenstadt': { lat: 52.0302, lng: 8.5311 },
      'mitte': { lat: 52.0302, lng: 8.5311 },
      'schildesche': { lat: 52.0450, lng: 8.4800 },
      'brackwede': { lat: 52.0050, lng: 8.5800 },
      'sennestadt': { lat: 51.9800, lng: 8.6200 },
      'heepen': { lat: 52.0500, lng: 8.6000 },
      'stieghorst': { lat: 52.0100, lng: 8.6100 },
      
      // Parks and outdoor areas
      'stadtpark': { lat: 52.0250, lng: 8.5280 },
      'bürgerpark': { lat: 52.0180, lng: 8.5200 },
      'tierpark': { lat: 52.0400, lng: 8.5100 },
      'botanischer garten': { lat: 52.0350, lng: 8.4900 },
      
      // Shopping and commercial
      'loom': { lat: 52.0200, lng: 8.5350 },
      'hauptbahnhof': { lat: 52.0280, lng: 8.5320 },
      'bahnhof': { lat: 52.0280, lng: 8.5320 },
      
      // Sports venues
      'schücoarena': { lat: 52.0320, lng: 8.5150 },
      'alm': { lat: 52.0320, lng: 8.5150 },
      'arminia': { lat: 52.0320, lng: 8.5150 },
      
      // Default fallback
      'bielefeld': bielefeldCenter
    };

    // Find exact matches first
    for (const [key, coords] of Object.entries(locationMap)) {
      if (locationLower === key || locationLower.includes(key)) {
        console.log(`Found coordinates for location "${location}": ${coords.lat}, ${coords.lng}`);
        return isLng ? coords.lng : coords.lat;
      }
    }

    // If no match found, use Bielefeld center with small random offset
    const offset = (Math.random() - 0.5) * 0.01; // Smaller offset for better clustering
    const coord = isLng ? bielefeldCenter.lng + offset : bielefeldCenter.lat + offset;
    console.log(`Using default coordinates with offset for location "${location}": ${coord}`);
    return coord;
  }

  // Filter events for today, Bielefeld (using city column), and with valid coordinates
  const todaysBielefeldEvents = React.useMemo(() => {
    console.log(`Filtering events for today (${today}) in Bielefeld...`);
    
    const filtered = events
      .filter(event => {
        const isToday = event.date === today;
        const hasLocation = event.location || event.city;
        // Filter specifically for Bielefeld using the city column
        const isBielefeld = event.city && event.city.toLowerCase() === 'bielefeld';
        
        console.log(`Event: ${event.title}, Date: ${event.date}, Location: ${event.location}, City: ${event.city}, IsToday: ${isToday}, HasLocation: ${hasLocation}, IsBielefeld: ${isBielefeld}`);
        return isToday && hasLocation && isBielefeld;
      })
      .map(event => {
        const locationText = event.location || event.city || event.title;
        const lat = getCoordinatesForLocation(locationText);
        const lng = getCoordinatesForLocation(locationText, true);
        
        return {
          ...event,
          lat,
          lng,
          attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0),
          eventHour: getHourFromTime(event.time)
        };
      })
      .filter(event => event.lat !== null && event.lng !== null);

    console.log(`Found ${filtered.length} events for today in Bielefeld with valid coordinates`);
    return filtered;
  }, [events, today]);

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
      if (!event.lat || !event.lng) return;
      
      try {
        const likes = event.likes || 0;
        // Determine marker size based on likes
        let markerSize = 40; // Default size
        let fontSize = 12;
        if (likes >= 50) {
          markerSize = 60;
          fontSize = 18;
        } else if (likes >= 20) {
          markerSize = 50;
          fontSize = 15;
        } else if (likes >= 5) {
          markerSize = 45;
          fontSize = 13;
        }

        const displayNumber = likes > 0 ? likes : (event.rsvp_yes || 1); // Fallback to rsvp_yes if likes is 0

        // Create custom marker icon
        const iconHtml = `
          <div style="
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: ${markerSize}px;
            height: ${markerSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize}px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${displayNumber}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
          popupAnchor: [0, -markerSize / 2]
        });

        const marker = L.marker([event.lat, event.lng], { icon: customIcon });

        // Create popup content with real location from database
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${event.title}</h3>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📍</span>
              <span>${event.location || 'Bielefeld'}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">🏙️</span>
              <span>${event.city || 'Bielefeld'}</span>
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
          <p className="text-gray-400">Heutige Events werden geladen...</p>
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