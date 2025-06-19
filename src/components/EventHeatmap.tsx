
import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { useEvents } from '@/hooks/useEvents';
import { MapMarkers } from './heatmap/MapMarkers';
import { HeatmapFilters } from './heatmap/HeatmapFilters';
import { HeatmapLegend } from './heatmap/HeatmapLegend';
import { useGeocodingCache } from './heatmap/useGeocodingCache';

// Workaround für Standard-Leaflet-Marker-Symbole
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const EventHeatmap = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Use the useEvents hook to get events data
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

  const eventCoordinates = useGeocodingCache(bielefeld_events);

  // Show loading state while events are being fetched
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
        <HeatmapFilters
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
        <HeatmapLegend />
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
