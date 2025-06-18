
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEventContext } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Users, MapPin, Filter, X } from 'lucide-react';
import { Event } from '@/types/eventTypes';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Wichtig: Leaflet CSS importieren
import L from 'leaflet'; // Leaflet selbst importieren für Marker-Symbole

const EventHeatmap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const { events } = useEventContext();

  // Filter events for Bielefeld
  const bielefeld_events = events.filter(event => 
    !event.city || 
    event.city.toLowerCase() === 'bielefeld' || 
    event.city.toLowerCase() === 'bi'
  );

  const categories = ['all', ...Array.from(new Set(bielefeld_events.map(e => e.category)))];

  const filteredEvents = bielefeld_events.filter(event => {
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    const dateMatch = !dateFilter || event.date === dateFilter;
    return categoryMatch && dateMatch;
  });

  // Geocoding function for addresses
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    if (!mapboxToken) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address + ', Bielefeld, Germany')}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return null;
  };

  // Get marker color based on event popularity
  const getMarkerColor = (event: Event): string => {
    const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
    if (popularity >= 20) return '#ef4444'; // red - very popular
    if (popularity >= 10) return '#f97316'; // orange - popular
    if (popularity >= 5) return '#eab308'; // yellow - moderate
    return '#22c55e'; // green - new/low popularity
  };

  // Create popup content
  const createPopupContent = (event: Event): string => {
    const participants = (event.rsvp_yes || 0);
    const likes = (event.likes || 0);
    
    return `
      <div class="p-4 bg-black text-white rounded-lg min-w-[300px]">
        <h3 class="font-bold text-lg mb-2 text-red-500">${event.title}</h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4">📅</span>
            <span>${new Date(event.date).toLocaleDateString('de-DE')}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4">🕐</span>
            <span>${event.time}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4">📍</span>
            <span>${event.location}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4">👥</span>
            <span>${participants} Teilnehmer</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4">❤️</span>
            <span>${likes} Likes</span>
          </div>
          <div class="mt-3">
            <span class="px-2 py-1 bg-red-500 text-white text-xs rounded-full">${event.category}</span>
          </div>
          ${event.description ? `<p class="mt-2 text-gray-300 text-xs">${event.description.substring(0, 100)}...</p>` : ''}
        </div>
      </div>
    `;
  };

  // Add markers to map
  const addMarkersToMap = async () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    for (const event of filteredEvents) {
      if (!event.location) continue;

      const coordinates = await geocodeAddress(event.location);
      if (!coordinates) continue;

      const color = getMarkerColor(event);
      const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
      const size = Math.max(15, Math.min(40, 15 + popularity * 2));

      // Create custom marker
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      `;
      
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });
      
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      const popup = new mapboxgl.Popup({
        offset: 25,
        className: 'custom-popup'
      }).setHTML(createPopupContent(event));

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    setShowTokenInput(false);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [8.5311, 52.0302], // Bielefeld coordinates
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      addMarkersToMap();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when filters change
  useEffect(() => {
    if (map.current) {
      addMarkersToMap();
    }
  }, [filteredEvents, selectedCategory, dateFilter]);

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <Card className="p-6 bg-gray-900 border-gray-700 max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Mapbox Token benötigt</h2>
          <p className="text-gray-300 mb-4 text-sm">
            Um die Heatmap zu verwenden, benötigen wir einen Mapbox Public Token. 
            Besuche <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">mapbox.com</a> und erstelle einen kostenlosen Account.
          </p>
          <Input
            type="text"
            placeholder="pk.eyJ1IjoiLi4u"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="mb-4 bg-gray-800 border-gray-600 text-white"
          />
          <Button 
            onClick={() => mapboxToken && setShowTokenInput(false)}
            disabled={!mapboxToken}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            Karte laden
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Filter Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Card className="p-4 bg-black/90 backdrop-blur border-gray-700">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Event Heatmap Bielefeld
          </h3>
          
          {/* Category Filter */}
          <div className="mb-3">
            <label className="text-white text-sm mb-2 block">Kategorie:</label>
            <div className="flex flex-wrap gap-1">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 
                    "bg-red-500 hover:bg-red-600 text-white" : 
                    "border-gray-600 text-gray-300 hover:bg-gray-800"
                  }
                >
                  {category === 'all' ? 'Alle' : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="mb-3">
            <label className="text-white text-sm mb-2 block">Datum:</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter('')}
                className="mt-1 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3 mr-1" />
                Filter löschen
              </Button>
            )}
          </div>

          {/* Legend */}
          <div>
            <label className="text-white text-sm mb-2 block">Legende:</label>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-300">Wenige Teilnehmer (&lt;5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Moderat (5-9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-300">Beliebt (10-19)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300">Sehr beliebt (20+)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-3 bg-black/90 backdrop-blur border-gray-700">
          <div className="text-white text-sm">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{filteredEvents.length} Events angezeigt</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span>{filteredEvents.reduce((sum, e) => sum + (e.rsvp_yes || 0), 0)} Teilnehmer total</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Custom CSS for popups */}
      <style jsx global>{`
        .custom-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: black !important;
        }
        .custom-marker:hover {
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default EventHeatmap;
