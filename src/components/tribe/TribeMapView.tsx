import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TribeEvent, Post } from '@/types/tribe';
import { Calendar, Filter, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TribeMapViewProps {
  events: TribeEvent[];
  posts: Post[];
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
  'Global': [51.1657, 10.4515], 
};

// Helper to provide nice visuals if no image exists
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
  
  // Default Nightlife
  return 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=100&h=100&fit=crop';
};

const getJitteredCoords = (city: string): [number, number] => {
  const base = CITY_COORDS[city] || CITY_COORDS['Bielefeld'];
  const latJitter = (Math.random() - 0.5) * 0.03;
  const lngJitter = (Math.random() - 0.5) * 0.03;
  return [base[0] + latJitter, base[1] + lngJitter];
};

const parseDateString = (dateStr: string): Date | null => {
  try {
    // Support ISO format "YYYY-MM-DD" from database
    if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateStr);
    }
    // Support German format "DD.MM.YYYY" or "WE, DD.MM.YYYY"
    const parts = dateStr.includes(',') ? dateStr.split(', ')[1] : dateStr;
    const [day, month, year] = parts.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } catch (e) {
    return null;
  }
};

export const TribeMapView: React.FC<TribeMapViewProps> = ({ events, posts, selectedCity, onEventClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); 
  const [filterMode, setFilterMode] = useState<'TODAY' | 'TOMORROW' | 'CUSTOM'>('TODAY');
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, {lat: number, lng: number}>>(new Map());

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = parseDateString(event.date);
      if (!eventDate) return false;
      return eventDate.toDateString() === currentDate.toDateString();
    });
  }, [events, currentDate]);

  const handleSetToday = () => {
      setCurrentDate(new Date());
      setFilterMode('TODAY');
  }

  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCurrentDate(tomorrow);
    setFilterMode('TOMORROW');
  }

  // Batch-Geocoding beim Mount
  useEffect(() => {
    const loadAllCoordinates = async () => {
      const uniqueLocations = [...new Set(
        events.filter(e => e.location).map(e => e.location)
      )];
      
      if (uniqueLocations.length === 0) return;
      
      console.log(`Batch geocoding ${uniqueLocations.length} locations for ${selectedCity}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('ai-batch-geocode', {
          body: { locations: uniqueLocations, cityContext: selectedCity }
        });
        
        if (error) {
          console.error('Batch geocoding error:', error);
          return;
        }
        
        const coordsMap = new Map<string, {lat: number, lng: number}>();
        data?.coordinates?.forEach((c: any) => {
          if (c.lat && c.lng && c.location) {
            coordsMap.set(c.location.toLowerCase(), { lat: c.lat, lng: c.lng });
          }
        });
        
        console.log(`Loaded ${coordsMap.size} coordinates from batch geocoding`);
        setEventCoordinates(coordsMap);
      } catch (err) {
        console.error('Failed to batch geocode:', err);
      }
    };
    
    loadAllCoordinates();
  }, [events, selectedCity]);

  useEffect(() => {
    if (!mapRef.current || typeof (window as any).L === 'undefined') return;

    if (!mapInstanceRef.current) {
      const L = (window as any).L;
      const initialCoords = selectedCity !== 'All' && CITY_COORDS[selectedCity] 
        ? CITY_COORDS[selectedCity] 
        : CITY_COORDS['Bielefeld'];

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(initialCoords, selectedCity === 'All' ? 7 : 13);

      // CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const L = (window as any).L;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // --- ADD EVENTS (IMAGES + ATTENDEE BADGE) ---
    filteredEvents.forEach(event => {
      // Use real coordinates from batch geocoding if available
      const realCoords = event.location 
        ? eventCoordinates.get(event.location.toLowerCase())
        : undefined;
      
      const coords: [number, number] = realCoords 
        ? [realCoords.lat, realCoords.lng]
        : getJitteredCoords(event.city || 'Bielefeld');
      
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
      
      if (onEventClick) {
        marker.on('click', () => onEventClick(event));
      }
    });

    // --- ADD POSTS (WHITE DOTS) ---
    posts.forEach(post => {
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
              <div style="font-size: 11px; color: #ffffff; font-weight: 600;">${post.user}</div>
           </div>
          <div style="font-size: 12px; font-weight: 400; color: #e4e4e7; line-height: 1.3;">"${post.text}"</div>
          <div style="font-size: 9px; color: #71717a; margin-top: 6px;">${post.time}</div>
        </div>
      `);
    });

    if (selectedCity !== 'All' && CITY_COORDS[selectedCity]) {
      map.flyTo(CITY_COORDS[selectedCity], 13, { duration: 1.5 });
    }

  }, [filteredEvents, posts, selectedCity, onEventClick, eventCoordinates]);

  const dateDisplay = currentDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  return (
    <div className="h-full w-full relative bg-surface">
      <div id="map" ref={mapRef} className="h-full w-full grayscale-[0.2]"></div>
      
      {/* HUD CONTROLS */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
         
         {/* Title Card */}
         <div className="bg-black/90 backdrop-blur-md px-4 py-3 border border-white/10 flex flex-col gap-1 shadow-xl pointer-events-auto min-w-[140px]">
             <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest border-b border-white/10 pb-1 mb-1">Live Map</span>
             <div className="flex items-center justify-between">
                <span className="text-xl font-light text-white">{dateDisplay}</span>
                <Calendar size={14} className="text-gold"/>
             </div>
             <div className="flex gap-1 mt-2">
                 <button 
                    onClick={handleSetToday}
                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex-1 transition-colors ${filterMode === 'TODAY' ? 'bg-gold text-black' : 'bg-white/10 text-zinc-400 hover:bg-white/20'}`}
                 >
                    Today
                 </button>
                 <button 
                    onClick={handleSetTomorrow}
                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex-1 transition-colors ${filterMode === 'TOMORROW' ? 'bg-white text-black' : 'bg-white/10 text-zinc-400 hover:bg-white/20'}`}
                 >
                    Tmrw
                 </button>
             </div>
         </div>

         {/* Legend */}
         <div className="bg-black/90 backdrop-blur-md px-3 py-2 border border-white/10 flex gap-4 shadow-xl pointer-events-auto">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-gold"></div>
                <span className="text-[9px] text-white uppercase tracking-wider">{filteredEvents.length} Events</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span className="text-[9px] text-white uppercase tracking-wider">Community</span>
             </div>
         </div>
      </div>
    </div>
  );
};
