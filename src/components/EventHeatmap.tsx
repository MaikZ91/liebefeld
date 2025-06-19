import React, { useEffect, useRef, useState } from 'react';
// Importe für react-leaflet
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Wichtig: Leaflet CSS importieren
import L from 'leaflet'; // Leaflet selbst importieren für Marker-Symbole

// Ihre bestehenden Komponenten-Importe
import { useEventContext } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Filter, X } from 'lucide-react';

// Workaround für Standard-Leaflet-Marker-Symbole
// Dies ist notwendig, da Leaflet standardmäßig versucht, Icons von einem bestimmten Pfad zu laden,
// der in einer modernen Build-Umgebung oft nicht existiert.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const EventHeatmap = () => {
    // mapContainer und map refs werden mit react-leaflet nicht mehr direkt benötigt
    // da MapContainer die Map-Instanz intern verwaltet.
    // markers ref ist weiterhin nützlich, falls Sie manuelle Marker-Logik hätten,
    // aber mit react-leaflet rendert man Marker oft direkt im JSX.
    const markers = useRef([]); // Kann beibehalten werden, falls für andere Zwecke nützlich

    // Mapbox Token und die zugehörige State-Variable sind nicht mehr erforderlich
    // const [mapboxToken, setMapboxToken] = useState('');
    // const [showTokenInput, setShowTokenInput] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const { events } = useEventContext();

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

    // Geocoding-Funktion für Adressen mit OpenStreetMap Nominatim
    // Wichtig: Beachten Sie die Nutzungsrichtlinien von Nominatim!
    const geocodeAddress = async (address) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Bielefeld, Germany')}&format=json&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                // Nominatim gibt [longitude, latitude] zurück, Leaflet/react-leaflet erwartet [latitude, longitude]
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        return null;
    };

    // Get marker color based on event popularity
    const getMarkerColor = (event) => {
        const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
        if (popularity >= 20) return '#ef4444'; // red - very popular
        if (popularity >= 10) return '#f97316'; // orange - popular
        if (popularity >= 5) return '#eab308'; // yellow - moderate
        return '#22c55e'; // green - new/low popularity
    };

    // Erstellen eines benutzerdefinierten Leaflet DivIcons
    const createCustomMarkerIcon = (color, size) => {
        return L.divIcon({
            className: 'custom-leaflet-marker', // Optional, für zusätzliches CSS
            html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2], // Zentriert den Marker auf der Koordinate
            popupAnchor: [0, -size / 2], // Position des Popups relativ zum Marker
        });
    };

    // Create popup content
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

    // Die Logik für die Token-Eingabe entfällt, da OpenStreetMap keinen Token benötigt.
    // Daher wird der showTokenInput-State und der zugehörige Render-Block entfernt.

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

            {/* MapContainer ist die Hauptkomponente von react-leaflet */}
            <MapContainer
                center={[52.0302, 8.5311]} // Initialzentrum: Bielefeld [latitude, longitude]
                zoom={12} // Initialzoomstufe
                scrollWheelZoom={true} // Scroll-Zoom aktivieren
                className="w-full h-full z-0" // Stellen Sie sicher, dass die Karte im Hintergrund ist
            >
                {/* TileLayer für OpenStreetMap-Kartenkacheln */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker für gefilterte Events */}
                {filteredEvents.map((event, index) => {
                    // Verwenden Sie einen lokalen State, um die asynchron geladenen Koordinaten zu speichern
                    const [coordinates, setCoordinates] = useState(null);

                    useEffect(() => {
                        const getCoords = async () => {
                            if (event.location) {
                                const coords = await geocodeAddress(event.location);
                                setCoordinates(coords);
                            }
                        };
                        getCoords();
                    }, [event.location]); // Abhängigkeit von event.location

                    if (!coordinates) {
                        return null; // Marker nicht anzeigen, bis Koordinaten verfügbar sind
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
            </MapContainer>
        </div>
    );
};

export default EventHeatmap;
