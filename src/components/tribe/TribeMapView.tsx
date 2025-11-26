import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TribeEvent, Post } from '@/types/tribe';

interface TribeMapViewProps {
  events: TribeEvent[];
  posts: Post[];
  selectedCity: string;
  onEventClick?: (event: TribeEvent) => void;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Bielefeld': [52.0302, 8.5325],
  'Berlin': [52.52, 13.405],
  'Hamburg': [53.5511, 9.9937],
  'München': [48.1351, 11.582],
  'Köln': [50.9375, 6.9603],
};

export const TribeMapView: React.FC<TribeMapViewProps> = ({ events, posts, selectedCity, onEventClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [filterMode, setFilterMode] = useState<'TODAY' | 'TOMORROW'>('TODAY');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const cityCoords = CITY_COORDS[selectedCity] || CITY_COORDS['Bielefeld'];

    const map = L.map(mapContainerRef.current, {
      center: cityCoords,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom CSS for dark urban aesthetic
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-tile-container {
        filter: grayscale(100%) brightness(0.4) sepia(100%) hue-rotate(330deg) saturate(150%);
      }
      .leaflet-control-attribution {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      document.head.removeChild(style);
    };
  }, [selectedCity]);

  // Update city center
  useEffect(() => {
    if (mapInstanceRef.current) {
      const cityCoords = CITY_COORDS[selectedCity] || CITY_COORDS['Bielefeld'];
      mapInstanceRef.current.setView(cityCoords, 13);
    }
  }, [selectedCity]);

  // Render markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const cityCoords = CITY_COORDS[selectedCity] || CITY_COORDS['Bielefeld'];

    const getJitteredCoords = (baseCoords: [number, number], index: number): [number, number] => {
      const offset = 0.01;
      const angle = (index * 2 * Math.PI) / Math.max(events.length, 8);
      return [
        baseCoords[0] + offset * Math.cos(angle) + (Math.random() - 0.5) * 0.005,
        baseCoords[1] + offset * Math.sin(angle) + (Math.random() - 0.5) * 0.005,
      ];
    };

    // Render event markers
    events.forEach((evt, idx) => {
      const coords = getJitteredCoords(cityCoords, idx);
      const attendees = evt.attendees || Math.floor(Math.random() * 50) + 10;

      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-gold shadow-lg hover:scale-110 transition-transform">
            ${evt.image_url 
              ? `<img src="${evt.image_url}" class="w-full h-full object-cover" alt="${evt.title}"/>`
              : `<div class="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-gold">?</div>`
            }
          </div>
          <div class="absolute -top-1 -right-1 bg-gold text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow">
            ${attendees}
          </div>
        </div>
      `;

      const marker = L.marker(coords, {
        icon: L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <div class="text-sm">
          <strong class="text-black">${evt.title}</strong><br/>
          <span class="text-xs text-gray-600">${evt.date} • ${evt.time || 'TBA'}</span><br/>
          <span class="text-xs text-gray-700">${attendees} going</span>
        </div>
      `);

      marker.on('click', () => {
        onEventClick && onEventClick(evt);
      });

      markersRef.current.push(marker);
    });

    // Render post markers (simple white dots)
    posts.forEach((post, idx) => {
      const coords = getJitteredCoords(cityCoords, idx + events.length);

      const iconHtml = `
        <div class="w-3 h-3 bg-white rounded-full shadow-md hover:scale-125 transition-transform cursor-pointer"></div>
      `;

      const marker = L.marker(coords, {
        icon: L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <div class="text-xs">
          <strong class="text-black">${post.user}</strong><br/>
          <span class="text-gray-700">${post.text}</span>
        </div>
      `);

      markersRef.current.push(marker);
    });
  }, [events, posts, selectedCity, onEventClick]);

  const handleSetToday = () => setFilterMode('TODAY');
  const handleSetTomorrow = () => setFilterMode('TOMORROW');

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none">
         <div className="flex gap-2 pointer-events-auto">
             <button 
                onClick={handleSetToday}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex-1 transition-colors ${filterMode === 'TODAY' ? 'bg-white text-black' : 'bg-white/10 text-zinc-400 hover:bg-white/20 backdrop-blur-md'}`}
             >
                Today
             </button>
             <button 
                onClick={handleSetTomorrow}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex-1 transition-colors ${filterMode === 'TOMORROW' ? 'bg-white text-black' : 'bg-white/10 text-zinc-400 hover:bg-white/20 backdrop-blur-md'}`}
             >
                Tmrw
             </button>
         </div>

         {/* Legend */}
         <div className="bg-black/90 backdrop-blur-md px-3 py-2 border border-white/10 flex gap-4 shadow-xl pointer-events-auto">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-gold"></div>
                <span className="text-[9px] text-zinc-300 uppercase tracking-wide">Events</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span className="text-[9px] text-zinc-300 uppercase tracking-wide">Posts</span>
             </div>
         </div>
      </div>
    </div>
  );
};
