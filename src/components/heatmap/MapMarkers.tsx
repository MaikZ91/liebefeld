
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface MapMarkersProps {
  events: any[];
  eventCoordinates: Record<string, [number, number]>;
}

export const MapMarkers: React.FC<MapMarkersProps> = ({ events, eventCoordinates }) => {
  // Get marker color based on event popularity
  const getMarkerColor = (event: any) => {
    const popularity = (event.likes || 0) + (event.rsvp_yes || 0);
    if (popularity >= 20) return '#ef4444'; // red - very popular
    if (popularity >= 10) return '#f97316'; // orange - popular
    if (popularity >= 5) return '#eab308'; // yellow - moderate
    return '#22c55e'; // green - new/low popularity
  };

  // Erstellen eines benutzerdefinierten Leaflet DivIcons
  const createCustomMarkerIcon = (color: string, size: number) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  // Create popup content
  const createPopupContent = (event: any) => {
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
