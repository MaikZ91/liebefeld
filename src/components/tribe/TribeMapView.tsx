import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TribeEvent } from '@/types/tribe';
import { MapPin, Users } from 'lucide-react';

interface TribeMapViewProps {
  events: TribeEvent[];
  onEventClick: (event: TribeEvent) => void;
}

export const TribeMapView: React.FC<TribeMapViewProps> = ({ events, onEventClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([52.0302, 8.5325], 13); // Bielefeld

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add event markers
    events.forEach((event) => {
      if (!event.location || !mapRef.current) return;

      // Create custom icon with attendee count
      const iconHtml = `
        <div class="flex flex-col items-center">
          <div class="bg-gold text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs shadow-lg">
            ${event.attendees || 0}
          </div>
          <div class="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gold -mt-1"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-tribe-marker',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });

      // Mock coordinates (in real app, geocode event.location)
      const lat = 52.0302 + (Math.random() - 0.5) * 0.02;
      const lng = 8.5325 + (Math.random() - 0.5) * 0.02;

      const marker = L.marker([lat, lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => onEventClick(event));

      // Add popup
      marker.bindPopup(`
        <div class="text-sm">
          <div class="font-bold">${event.title}</div>
          <div class="text-zinc-500 text-xs">${event.category}</div>
          <div class="text-xs mt-1">${event.attendees || 0} going</div>
        </div>
      `);
    });
  }, [events, onEventClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-md rounded-lg p-3 border border-white/10">
        <div className="text-white text-xs font-semibold mb-2">Legend</div>
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Users size={12} className="text-gold" />
          <span>Attendee Count</span>
        </div>
      </div>
    </div>
  );
};
