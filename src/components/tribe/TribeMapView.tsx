import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TribeEvent, Post } from '@/types/tribe';

interface TribeMapViewProps {
  events: TribeEvent[];
  posts?: Post[];
  onEventClick: (event: TribeEvent) => void;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Bielefeld': [52.0302, 8.5325],
  'Berlin': [52.5200, 13.4050],
  'Hamburg': [53.5511, 9.9937],
  'Cologne': [50.9375, 6.9603],
  'Munich': [48.1351, 11.5820],
};

const getCategoryImage = (category?: string) => {
  const cat = category?.toUpperCase() || '';
  if (cat.includes('PARTY') || cat.includes('TECHNO') || cat.includes('RAVE')) 
    return 'https://images.unsplash.com/photo-1574391884720-385075a8529e?w=100&h=100&fit=crop';
  if (cat.includes('ART') || cat.includes('CULTURE')) 
    return 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=100&h=100&fit=crop';
  if (cat.includes('SPORT') || cat.includes('RUN')) 
    return 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=100&h=100&fit=crop';
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=100&h=100&fit=crop';
};

const getJitteredCoords = (city: string): [number, number] => {
  const base = CITY_COORDS[city] || CITY_COORDS['Bielefeld'];
  return [
    base[0] + (Math.random() - 0.5) * 0.02,
    base[1] + (Math.random() - 0.5) * 0.02
  ];
};

export const TribeMapView: React.FC<TribeMapViewProps> = ({ events, posts = [], onEventClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([52.0302, 8.5325], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    // Add custom CSS for markers
    const style = document.createElement('style');
    style.textContent = `
      .marker-pin-image {
        width: 48px;
        height: 48px;
        position: relative;
        cursor: pointer;
      }
      .marker-pin-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
        border: 2px solid #000;
      }
      .marker-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #d4b483;
        color: #000;
        font-size: 9px;
        font-weight: 700;
        padding: 2px 4px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        gap: 2px;
        z-index: 10;
        border: 1px solid #000;
      }
      .marker-badge svg {
        width: 8px;
        height: 8px;
      }
      .marker-pin-social {
        width: 24px;
        height: 24px;
        background: white;
        border: 2px solid #000;
        border-radius: 50%;
        cursor: pointer;
      }
      .custom-div-icon {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add event markers
    events.forEach((event) => {
      const coords = getJitteredCoords(event.city || 'Bielefeld');
      const imgUrl = event.image_url || getCategoryImage(event.category);
      const attendees = event.attendees || Math.floor(Math.random() * 50) + 10;
      
      const eventIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="marker-pin-image">
            <div class="marker-badge">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              ${attendees}
            </div>
            <img src="${imgUrl}" alt="${event.title}" />
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 54]
      });

      const marker = L.marker(coords, { icon: eventIcon, zIndexOffset: 100 }).addTo(map);
      
      marker.bindPopup(`
        <div style="min-width: 180px; font-family: 'Outfit', sans-serif;">
          <div style="height: 80px; width: 100%; overflow: hidden; margin-bottom: 8px;">
            <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="padding: 0 4px 4px 4px;">
            <div style="font-size: 10px; color: #d4b483; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${event.category || 'Event'}</div>
            <div style="font-size: 14px; font-weight: 600; color: #fff; margin-top: 2px; line-height: 1.2;">${event.title}</div>
            <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">${event.date} • +${attendees} going</div>
          </div>
        </div>
      `);

      marker.on('click', () => onEventClick(event));
    });

    // Add post markers (white dots)
    posts.forEach((post) => {
      const coords = getJitteredCoords(post.city || 'Bielefeld');
      
      const socialIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pin-social"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(coords, { icon: socialIcon, zIndexOffset: 50 }).addTo(map);
      
      marker.bindPopup(`
        <div style="min-width: 140px; font-family: 'Outfit', sans-serif;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <div style="width: 16px; height: 16px; background: #fff; border-radius: 50%;"></div>
            <div style="font-size: 12px; font-weight: 600; color: #fff;">${post.user}</div>
          </div>
          <div style="font-size: 11px; color: #d4d4d8; line-height: 1.4; margin-bottom: 4px;">${post.text.substring(0, 100)}${post.text.length > 100 ? '...' : ''}</div>
          <div style="font-size: 10px; color: #71717a;">${post.time}</div>
        </div>
      `);
    });
  }, [events, posts, onEventClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};
