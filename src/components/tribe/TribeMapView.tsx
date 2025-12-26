import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TribeEvent } from '@/types/tribe';
import { Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TribeMapViewProps {
  events: TribeEvent[];
  posts?: any[];
  selectedCity: string;
  onEventClick?: (event: TribeEvent) => void;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Bielefeld': [52.0302, 8.5325],
  'Dortmund': [51.5136, 7.4653],
  'Berlin': [52.5200, 13.4050],
  'Hamburg': [53.5511, 9.9937],
  'Cologne': [50.9375, 6.9603],
  'Munich': [48.1351, 11.5820],
  'Stuttgart': [48.7758, 9.1829],
  'Leipzig': [51.3397, 12.3731],
  'Münster': [51.9607, 7.6261],
  'Global': [51.1657, 10.4515], 
};

const getCategoryImage = (category?: string) => {
  const cat = category?.toUpperCase() || '';
  if (cat.includes('PARTY') || cat.includes('TECHNO') || cat.includes('RAVE') || cat.includes('AUSGEHEN')) 
    return 'https://images.unsplash.com/photo-1574391884720-385075a8529e?w=100&h=100&fit=crop';
  if (cat.includes('ART') || cat.includes('CULTURE') || cat.includes('KREATIVITÄT')) 
    return 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=100&h=100&fit=crop';
  if (cat.includes('SPORT') || cat.includes('RUN')) 
    return 'https://images.unsplash.com/photo-1552674605-469455cad900?w=100&h=100&fit=crop';
  if (cat.includes('CONCERT') || cat.includes('LIVE')) 
    return 'https://images.unsplash.com/photo-1459749411177-287ce38e315f?w=100&h=100&fit=crop';
  return 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=100&h=100&fit=crop';
};

const getJitteredCoords = (city: string): [number, number] => {
  const base = CITY_COORDS[city] || CITY_COORDS['Bielefeld'];
  const latJitter = (Math.random() - 0.5) * 0.025;
  const lngJitter = (Math.random() - 0.5) * 0.025;
  return [base[0] + latJitter, base[1] + lngJitter];
};

const parseDateString = (dateStr: string): Date | null => {
  try {
    if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateStr);
    }
    const parts = dateStr.includes(',') ? dateStr.split(', ')[1] : dateStr;
    const [day, month, year] = parts.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } catch (e) {
    return null;
  }
};

export const TribeMapView: React.FC<TribeMapViewProps> = ({ events, selectedCity, onEventClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [filterMode, setFilterMode] = useState<'TODAY' | 'TOMORROW' | 'WEEK'>('TODAY');
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, {lat: number, lng: number}>>(new Map());

  // Filter events based on date range
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let endDate = new Date(today);
    if (filterMode === 'TOMORROW') {
      endDate.setDate(endDate.getDate() + 1);
    } else if (filterMode === 'WEEK') {
      endDate.setDate(endDate.getDate() + 7);
    }
    
    return events.filter(event => {
      const eventDate = parseDateString(event.date);
      if (!eventDate) return false;
      eventDate.setHours(0, 0, 0, 0);
      
      if (filterMode === 'TODAY') {
        return eventDate.getTime() === today.getTime();
      } else if (filterMode === 'TOMORROW') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return eventDate.getTime() === tomorrow.getTime();
      } else {
        return eventDate >= today && eventDate <= endDate;
      }
    });
  }, [events, filterMode]);

  // Batch-Geocoding
  useEffect(() => {
    const loadAllCoordinates = async () => {
      const uniqueLocations = [...new Set(
        events.filter(e => e.location).map(e => e.location)
      )];
      
      if (uniqueLocations.length === 0) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('ai-batch-geocode', {
          body: { locations: uniqueLocations, cityContext: selectedCity }
        });
        
        if (!error && data?.coordinates) {
          const coordsMap = new Map<string, {lat: number, lng: number}>();
          data.coordinates.forEach((c: any) => {
            if (c.lat && c.lng && c.location) {
              coordsMap.set(c.location.toLowerCase(), { lat: c.lat, lng: c.lng });
            }
          });
          setEventCoordinates(coordsMap);
        }
      } catch (err) {
        console.error('Failed to batch geocode:', err);
      }
    };
    
    loadAllCoordinates();
  }, [events, selectedCity]);

  // Initialize and update map
  useEffect(() => {
    if (!mapRef.current || typeof (window as any).L === 'undefined') return;

    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const initialCoords = selectedCity !== 'All' && CITY_COORDS[selectedCity] 
        ? CITY_COORDS[selectedCity] 
        : CITY_COORDS['Bielefeld'];

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(initialCoords, selectedCity === 'All' ? 7 : 13);

      // Dark map style
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add event markers
    filteredEvents.forEach(event => {
      const realCoords = event.location 
        ? eventCoordinates.get(event.location.toLowerCase())
        : undefined;
      
      const coords = realCoords 
        ? [realCoords.lat, realCoords.lng]
        : getJitteredCoords(event.city || selectedCity);
      
      const imgUrl = event.image_url || getCategoryImage(event.category);
      const likes = event.likes || 0;
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="event-marker">
            <div class="marker-inner">
              <img src="${imgUrl}" alt="${event.title}" class="marker-image" />
              ${likes > 0 ? `
                <div class="likes-badge">
                  <span>${likes}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 52]
      });

      const leafletMarker = L.marker(coords, { icon }).addTo(map);
      
      // Popup with event info
      const popupContent = `
        <div class="event-popup">
          <h3 class="popup-title">${event.title}</h3>
          <div class="popup-meta">
            <span>📅 ${event.date}</span>
            ${event.time ? `<span>🕐 ${event.time}</span>` : ''}
          </div>
          ${event.location ? `<div class="popup-location">📍 ${event.location}</div>` : ''}
          ${event.category ? `<div class="popup-category">${event.category}</div>` : ''}
        </div>
      `;
      
      leafletMarker.bindPopup(popupContent, {
        className: 'event-popup-container',
        maxWidth: 280
      });
      
      if (onEventClick) {
        leafletMarker.on('click', () => onEventClick(event));
      }
    });

    // Fly to city
    if (selectedCity !== 'All' && CITY_COORDS[selectedCity]) {
      map.flyTo(CITY_COORDS[selectedCity], 13, { duration: 1.5 });
    }

  }, [filteredEvents, eventCoordinates, selectedCity, onEventClick]);

  return (
    <div className="h-full w-full relative bg-surface">
      {/* Custom CSS for markers */}
      <style>{`
        .event-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .marker-inner {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid hsl(var(--gold));
          overflow: hidden;
          position: relative;
          background: #18181b;
          box-shadow: 0 0 12px rgba(212, 180, 131, 0.4);
        }
        .marker-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .likes-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: hsl(var(--gold));
          color: black;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .event-popup-container .leaflet-popup-content-wrapper {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 0;
        }
        .event-popup-container .leaflet-popup-tip {
          background: #18181b;
          border: 1px solid #27272a;
        }
        .event-popup {
          min-width: 200px;
          padding: 12px;
          font-family: 'Outfit', sans-serif;
        }
        .popup-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .popup-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #a1a1aa;
          margin-bottom: 4px;
        }
        .popup-location {
          font-size: 11px;
          color: #71717a;
          margin-bottom: 8px;
        }
        .popup-category {
          font-size: 10px;
          color: hsl(var(--gold));
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
      `}</style>
      
      <div id="map" ref={mapRef} className="h-full w-full"></div>
      
      {/* Simple Date Filter */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="bg-black/90 backdrop-blur-md px-4 py-3 border border-white/10 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-gold" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Events</span>
          </div>
          
          <div className="flex gap-1">
            {(['TODAY', 'TOMORROW', 'WEEK'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterMode === mode 
                    ? 'bg-gold text-black' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {mode === 'TODAY' ? 'Heute' : mode === 'TOMORROW' ? 'Morgen' : '7 Tage'}
              </button>
            ))}
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-zinc-400">
            <MapPin size={12} />
            <span className="text-xs">{filteredEvents.length} Events</span>
          </div>
        </div>
      </div>
    </div>
  );
};
