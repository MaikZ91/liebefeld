
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';

// Fix for default Leaflet marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Separate component for map markers
const MapMarkers = ({ events, eventCoordinates }) => {
    const getMarkerColor = (event) => {
        const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
        if (popularity >= 20) return '#ef4444';
        if (popularity >= 10) return '#f97316';
        if (popularity >= 5) return '#eab308';
        return '#22c55e';
    };

    const createCustomMarkerIcon = (color, size) => {
        return L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
        });
    };

    const createPopupContent = (event) => {
        const participants = event.rsvp_yes || 0;
        const likes = event.likes || 0;
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

    return (
        <>
            {events.map((event, index) => {
                const coordinates = eventCoordinates[event.id];
                
                if (!coordinates) {
                    return null;
                }

                const color = getMarkerColor(event);
                const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
                const size = Math.max(15, Math.min(40, 15 + popularity * 2));
                const customIcon = createCustomMarkerIcon(color, size);

                return (
                    <Marker key={event.id || index} position={coordinates} icon={customIcon}>
                        <Popup className="custom-popup">
                            <div dangerouslySetInnerHTML={{ __html: createPopupContent(event) }} />
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

const EventHeatmap = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [eventCoordinates, setEventCoordinates] = useState({});
    
    const { events, isLoading } = useEvents();

    console.log('EventHeatmap: component mounted, events:', events.length);

    // Filter events for Bielefeld
    const bielefeld_events = events.filter(
        (event) => !event.city || event.city.toLowerCase() === 'bielefeld' || event.city.toLowerCase() === 'bi'
    );

    const categories = [
        'all',
        ...Array.from(new Set(bielefeld_events.map((e) => e.category))),
    ];

    const filteredEvents = bielefeld_events.filter((event) => {
        const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
        const dateMatch = !dateFilter || event.date === dateFilter;
        return categoryMatch && dateMatch;
    });

    // Geocoding function using OpenStreetMap Nominatim
    const geocodeAddress = async (address) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Bielefeld, Germany')}&format=json&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        return null;
    };

    // Geocode all events when component mounts or events change
    useEffect(() => {
        const geocodeEvents = async () => {
            const newCoordinates = {};
            
            for (const event of bielefeld_events) {
                if (event.location && !eventCoordinates[event.id]) {
                    const coords = await geocodeAddress(event.location);
                    if (coords) {
                        newCoordinates[event.id] = coords;
                    }
                }
            }
            
            if (Object.keys(newCoordinates).length > 0) {
                setEventCoordinates(prev => ({ ...prev, ...newCoordinates }));
            }
        };

        if (bielefeld_events.length > 0) {
            geocodeEvents();
        }
    }, [bielefeld_events.length]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <div className="text-center">
                    <h2 className="text-xl mb-2">Lade Events...</h2>
                    <p className="text-gray-400">Bitte warten Sie einen Moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black">
            <div className="absolute top-4 left-4 z-10 space-y-2">
                <Card className="p-4 bg-black/90 backdrop-blur border-gray-700">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Event Heatmap Bielefeld
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {categories.map((category) => (
                            <Button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`text-xs px-3 py-1 rounded-full ${
                                    selectedCategory === category
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {category === 'all' ? 'Alle Kategorien' : category}
                            </Button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-gray-800 border-gray-600 text-white text-xs py-1 px-2 rounded w-40"
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
                </Card>

                <Card className="p-4 bg-black/90 backdrop-blur border-gray-700 text-white text-sm">
                    <h4 className="font-bold mb-2">Legende:</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#ef4444]"></span> Sehr beliebt (20+ Teilnehmer/Likes)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#f97316]"></span> Beliebt (10-19 Teilnehmer/Likes)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#eab308]"></span> Moderat (5-9 Teilnehmer/Likes)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#22c55e]"></span> Neu/Gering (0-4 Teilnehmer/Likes)
                        </div>
                    </div>
                </Card>
            </div>

            <MapContainer
                center={[52.0302, 8.5311]}
                zoom={12}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapMarkers events={filteredEvents} eventCoordinates={eventCoordinates} />
            </MapContainer>
        </div>
    );
};

export default EventHeatmap;
