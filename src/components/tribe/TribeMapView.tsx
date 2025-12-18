import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TribeEvent, Post } from '@/types/tribe';
import { Calendar, Filter, Users, Flame, Zap, Heart, MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getVibeBadgeColor } from '@/utils/tribe/eventHelpers';

interface TribeMapViewProps {
  events: TribeEvent[];
  posts: Post[];
  selectedCity: string;
  onEventClick?: (event: TribeEvent) => void;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  type: 'event' | 'meetup' | 'community';
  vibe?: 'RAGE' | 'CHILL' | 'ARTSY' | 'FLIRTY';
}

interface ActivityMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'event' | 'meetup' | 'checkin' | 'hotspot';
  title: string;
  vibe?: 'RAGE' | 'CHILL' | 'ARTSY' | 'FLIRTY';
  attendees: number;
  avatars: string[];
  intensity: number; // 0-100 heat level
  event?: TribeEvent;
  meetupText?: string;
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

// Vibe color mapping for markers
const VIBE_COLORS: Record<string, string> = {
  'RAGE': '#ef4444',    // Red - energetic, party
  'CHILL': '#3b82f6',   // Blue - relaxed
  'ARTSY': '#a855f7',   // Purple - creative
  'FLIRTY': '#ec4899',  // Pink - social
  'DEFAULT': '#d4b483'  // Gold - default
};

const VIBE_GLOW: Record<string, string> = {
  'RAGE': '0 0 20px rgba(239, 68, 68, 0.8)',
  'CHILL': '0 0 20px rgba(59, 130, 246, 0.8)',
  'ARTSY': '0 0 20px rgba(168, 85, 247, 0.8)',
  'FLIRTY': '0 0 20px rgba(236, 72, 153, 0.8)',
  'DEFAULT': '0 0 20px rgba(212, 180, 131, 0.8)'
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

// Extract avatars from liked_by_users JSON
const extractAvatars = (likedByUsers: any): string[] => {
  if (!likedByUsers) return [];
  try {
    const users = Array.isArray(likedByUsers) ? likedByUsers : [];
    return users.slice(0, 5).map((u: any) => u.avatar_url || u.avatar).filter(Boolean);
  } catch {
    return [];
  }
};

export const TribeMapView: React.FC<TribeMapViewProps> = ({ events, posts, selectedCity, onEventClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); 
  const [filterMode, setFilterMode] = useState<'TODAY' | 'TOMORROW' | 'WEEK'>('TODAY');
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, {lat: number, lng: number}>>(new Map());
  const [communityMeetups, setCommunityMeetups] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [vibeFilter, setVibeFilter] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

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
    }).filter(e => !vibeFilter || e.vibe === vibeFilter);
  }, [events, filterMode, vibeFilter]);

  // Calculate activity markers with heat intensity
  const activityMarkers = useMemo((): ActivityMarker[] => {
    const markers: ActivityMarker[] = [];
    
    filteredEvents.forEach(event => {
      const realCoords = event.location 
        ? eventCoordinates.get(event.location.toLowerCase())
        : undefined;
      
      const coords = realCoords 
        ? [realCoords.lat, realCoords.lng]
        : getJitteredCoords(event.city || selectedCity);
      
      const likes = event.likes || 0;
      const attendees = event.attendees || likes || Math.floor(Math.random() * 30) + 5;
      const avatars = extractAvatars(event.liked_by_users);
      
      // Calculate intensity based on multiple factors
      const recency = event.created_at ? Math.max(0, 7 - Math.floor((Date.now() - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
      const intensity = Math.min(100, (likes * 5) + (attendees * 2) + (recency * 3) + (avatars.length * 10));
      
      markers.push({
        id: event.id,
        lat: coords[0] as number,
        lng: coords[1] as number,
        type: 'event',
        title: event.title,
        vibe: event.vibe,
        attendees,
        avatars,
        intensity,
        event
      });
    });
    
    // Add community meetup markers
    communityMeetups.forEach((meetup, idx) => {
      const coords = getJitteredCoords(selectedCity);
      const responses = meetup.meetup_responses || {};
      const attendeeCount = (responses['bin dabei'] || []).length;
      const avatars = (responses['bin dabei'] || []).slice(0, 5).map((u: any) => u.avatar).filter(Boolean);
      
      markers.push({
        id: `meetup-${meetup.id}`,
        lat: coords[0],
        lng: coords[1],
        type: 'meetup',
        title: meetup.event_title || 'Community Meetup',
        vibe: 'FLIRTY',
        attendees: attendeeCount,
        avatars,
        intensity: Math.min(100, attendeeCount * 20 + 30),
        meetupText: meetup.text
      });
    });
    
    return markers;
  }, [filteredEvents, eventCoordinates, communityMeetups, selectedCity]);

  // Heatmap data points
  const heatmapData = useMemo(() => {
    return activityMarkers.map(m => [m.lat, m.lng, m.intensity / 100] as [number, number, number]);
  }, [activityMarkers]);

  // Load community meetups with RSVP data
  useEffect(() => {
    const loadMeetups = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or('text.ilike.%Meetup%,text.ilike.%treffen%,event_id.not.is.null')
          .not('meetup_responses', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (!error && data) {
          setCommunityMeetups(data.filter(m => 
            Object.keys(m.meetup_responses || {}).length > 0 ||
            m.text?.includes('Meetup') ||
            m.event_id
          ));
        }
      } catch (err) {
        console.error('Error loading meetups:', err);
      }
    };
    
    loadMeetups();
    
    // Real-time subscription for meetup updates
    const channel = supabase
      .channel('meetup-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        loadMeetups();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      if (layer instanceof L.Marker || layer._heat) {
        map.removeLayer(layer);
      }
    });

    // Add heatmap layer if enabled and leaflet.heat is available
    if (showHeatmap && heatmapData.length > 0 && (L as any).heatLayer) {
      heatLayerRef.current = (L as any).heatLayer(heatmapData, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        max: 1.0,
        gradient: {
          0.2: '#3b82f6',  // Blue - low activity
          0.4: '#a855f7',  // Purple
          0.6: '#ec4899',  // Pink
          0.8: '#f97316',  // Orange
          1.0: '#ef4444'   // Red - high activity
        }
      }).addTo(map);
    }

    // Add activity markers
    activityMarkers.forEach(marker => {
      const vibeColor = VIBE_COLORS[marker.vibe || 'DEFAULT'];
      const vibeGlow = VIBE_GLOW[marker.vibe || 'DEFAULT'];
      const imgUrl = marker.event?.image_url || getCategoryImage(marker.event?.category);
      
      // Create avatar ring HTML
      const avatarRingHtml = marker.avatars.length > 0 
        ? `<div class="avatar-ring">
            ${marker.avatars.slice(0, 3).map((av, i) => 
              `<img src="${av}" class="ring-avatar" style="transform: translateX(${i * -8}px);" />`
            ).join('')}
            ${marker.avatars.length > 3 ? `<span class="more-avatars">+${marker.avatars.length - 3}</span>` : ''}
           </div>`
        : '';
      
      // Intensity-based size
      const size = Math.max(48, Math.min(72, 48 + (marker.intensity / 100) * 24));
      const pulseClass = marker.intensity > 60 ? 'pulse-hot' : marker.intensity > 30 ? 'pulse-warm' : '';
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="vibe-marker ${pulseClass}" style="
            --vibe-color: ${vibeColor};
            --vibe-glow: ${vibeGlow};
            width: ${size}px;
            height: ${size}px;
          ">
            <div class="marker-inner" style="border-color: ${vibeColor};">
              ${marker.type === 'event' 
                ? `<img src="${imgUrl}" alt="${marker.title}" class="marker-image" />`
                : `<div class="meetup-icon">🤝</div>`
              }
              <div class="vibe-badge" style="background: ${vibeColor};">
                <span class="vibe-text">${marker.vibe || 'EVENT'}</span>
              </div>
              <div class="attendee-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                ${marker.attendees}
              </div>
            </div>
            ${avatarRingHtml}
            ${marker.intensity > 70 ? '<div class="heat-pulse"></div>' : ''}
          </div>
        `,
        iconSize: [size, size + 20],
        iconAnchor: [size / 2, size + 10]
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon, zIndexOffset: marker.intensity }).addTo(map);
      
      // Popup with detailed info
      const popupContent = `
        <div class="vibe-popup" style="--vibe-color: ${vibeColor};">
          <div class="popup-header" style="background: linear-gradient(135deg, ${vibeColor}22, transparent);">
            <span class="popup-vibe" style="color: ${vibeColor};">${marker.vibe || 'EVENT'}</span>
            <span class="popup-intensity">${marker.intensity}% HEAT</span>
          </div>
          <h3 class="popup-title">${marker.title}</h3>
          ${marker.event ? `
            <div class="popup-meta">
              <span>📅 ${marker.event.date}</span>
              ${marker.event.time ? `<span>🕐 ${marker.event.time}</span>` : ''}
            </div>
            ${marker.event.location ? `<div class="popup-location">📍 ${marker.event.location}</div>` : ''}
          ` : ''}
          <div class="popup-stats">
            <div class="stat">
              <span class="stat-value">${marker.attendees}</span>
              <span class="stat-label">Going</span>
            </div>
            <div class="stat">
              <span class="stat-value">${marker.avatars.length}</span>
              <span class="stat-label">Community</span>
            </div>
            <div class="stat">
              <span class="stat-value" style="color: ${vibeColor};">🔥</span>
              <span class="stat-label">${marker.intensity > 70 ? 'HOT' : marker.intensity > 40 ? 'WARM' : 'CHILL'}</span>
            </div>
          </div>
          ${marker.avatars.length > 0 ? `
            <div class="popup-avatars">
              ${marker.avatars.map(av => `<img src="${av}" class="popup-avatar" />`).join('')}
            </div>
          ` : ''}
        </div>
      `;
      
      leafletMarker.bindPopup(popupContent, {
        className: 'vibe-popup-container',
        maxWidth: 280
      });
      
      if (onEventClick && marker.event) {
        leafletMarker.on('click', () => onEventClick(marker.event!));
      }
    });

    // Fly to city
    if (selectedCity !== 'All' && CITY_COORDS[selectedCity]) {
      map.flyTo(CITY_COORDS[selectedCity], 13, { duration: 1.5 });
    }

  }, [activityMarkers, heatmapData, selectedCity, onEventClick, showHeatmap]);

  // Stats
  const stats = useMemo(() => {
    const totalAttendees = activityMarkers.reduce((sum, m) => sum + m.attendees, 0);
    const hotspots = activityMarkers.filter(m => m.intensity > 60).length;
    const avgHeat = activityMarkers.length > 0 
      ? Math.round(activityMarkers.reduce((sum, m) => sum + m.intensity, 0) / activityMarkers.length)
      : 0;
    return { totalAttendees, hotspots, avgHeat };
  }, [activityMarkers]);

  const dateDisplay = currentDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  return (
    <div className="h-full w-full relative bg-surface">
      {/* Custom CSS for markers */}
      <style>{`
        .vibe-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .marker-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid;
          overflow: hidden;
          position: relative;
          background: #18181b;
          box-shadow: var(--vibe-glow);
        }
        .marker-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .meetup-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: linear-gradient(135deg, #ec489922, #18181b);
        }
        .vibe-badge {
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: white;
          white-space: nowrap;
        }
        .attendee-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #18181b;
          border: 2px solid var(--vibe-color);
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 9px;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .avatar-ring {
          display: flex;
          margin-top: 4px;
          justify-content: center;
        }
        .ring-avatar {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #18181b;
          object-fit: cover;
        }
        .more-avatars {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #27272a;
          border: 2px solid #18181b;
          font-size: 8px;
          color: #a1a1aa;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateX(-8px);
        }
        .heat-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150%;
          height: 150%;
          border-radius: 50%;
          background: var(--vibe-color);
          opacity: 0.3;
          animation: heatPulse 2s ease-out infinite;
        }
        .pulse-hot .marker-inner {
          animation: pulseHot 1.5s ease-in-out infinite;
        }
        .pulse-warm .marker-inner {
          animation: pulseWarm 2s ease-in-out infinite;
        }
        @keyframes heatPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes pulseHot {
          0%, 100% { box-shadow: var(--vibe-glow); }
          50% { box-shadow: var(--vibe-glow), 0 0 30px var(--vibe-color); }
        }
        @keyframes pulseWarm {
          0%, 100% { box-shadow: var(--vibe-glow); }
          50% { box-shadow: var(--vibe-glow), 0 0 15px var(--vibe-color); }
        }
        .vibe-popup-container .leaflet-popup-content-wrapper {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 0;
        }
        .vibe-popup-container .leaflet-popup-tip {
          background: #18181b;
          border: 1px solid #27272a;
        }
        .vibe-popup {
          min-width: 220px;
          font-family: 'Outfit', sans-serif;
        }
        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #27272a;
        }
        .popup-vibe {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .popup-intensity {
          font-size: 10px;
          color: #f97316;
          font-weight: 600;
        }
        .popup-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          padding: 8px 12px 4px;
          line-height: 1.3;
        }
        .popup-meta {
          display: flex;
          gap: 12px;
          padding: 0 12px;
          font-size: 11px;
          color: #a1a1aa;
        }
        .popup-location {
          font-size: 11px;
          color: #71717a;
          padding: 4px 12px 8px;
        }
        .popup-stats {
          display: flex;
          gap: 8px;
          padding: 8px 12px;
          border-top: 1px solid #27272a;
        }
        .stat {
          flex: 1;
          text-align: center;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          display: block;
        }
        .stat-label {
          font-size: 9px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .popup-avatars {
          display: flex;
          gap: 4px;
          padding: 0 12px 12px;
          flex-wrap: wrap;
        }
        .popup-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #27272a;
        }
      `}</style>
      
      <div id="map" ref={mapRef} className="h-full w-full"></div>
      
      {/* HUD CONTROLS */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
         
        {/* Title Card */}
        <div className="bg-black/95 backdrop-blur-md px-4 py-3 border border-white/10 flex flex-col gap-1 shadow-xl pointer-events-auto min-w-[180px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest">LIVE HEATMAP</span>
            <Flame size={12} className="text-orange-500 animate-pulse"/>
          </div>
          
          {/* Date Filter */}
          <div className="flex gap-1">
            {(['TODAY', 'TOMORROW', 'WEEK'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2 py-1 text-[8px] font-bold uppercase tracking-wider flex-1 transition-all ${
                  filterMode === mode 
                    ? 'bg-gold text-black' 
                    : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                }`}
              >
                {mode === 'TODAY' ? 'Heute' : mode === 'TOMORROW' ? 'Morgen' : '7 Tage'}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe Filter */}
        <div className="bg-black/95 backdrop-blur-md px-3 py-2 border border-white/10 shadow-xl pointer-events-auto">
          <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest block mb-2">VIBE FILTER</span>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setVibeFilter(null)}
              className={`px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-all ${
                !vibeFilter ? 'bg-gold text-black' : 'bg-white/5 text-zinc-500'
              }`}
            >
              ALL
            </button>
            {(['RAGE', 'CHILL', 'ARTSY', 'FLIRTY'] as const).map(vibe => (
              <button
                key={vibe}
                onClick={() => setVibeFilter(vibeFilter === vibe ? null : vibe)}
                className={`px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-all`}
                style={{
                  background: vibeFilter === vibe ? VIBE_COLORS[vibe] : 'rgba(255,255,255,0.05)',
                  color: vibeFilter === vibe ? '#fff' : VIBE_COLORS[vibe]
                }}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-black/95 backdrop-blur-md px-3 py-2 border border-white/10 shadow-xl pointer-events-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{filteredEvents.length}</div>
              <div className="text-[8px] text-zinc-500 uppercase tracking-wider">Events</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">{stats.hotspots}</div>
              <div className="text-[8px] text-zinc-500 uppercase tracking-wider">Hotspots</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gold">{stats.totalAttendees}</div>
              <div className="text-[8px] text-zinc-500 uppercase tracking-wider">Going</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-black/95 backdrop-blur-md px-3 py-2 border border-white/10 shadow-xl pointer-events-auto">
          <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest block mb-2">HEAT LEGEND</span>
          <div className="flex items-center gap-1">
            <div className="w-full h-2 rounded-full" style={{
              background: 'linear-gradient(90deg, #3b82f6, #a855f7, #ec4899, #f97316, #ef4444)'
            }}></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[7px] text-blue-400">CHILL</span>
            <span className="text-[7px] text-red-400">HOT 🔥</span>
          </div>
        </div>
        
        {/* Toggle Heatmap */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`bg-black/95 backdrop-blur-md px-3 py-2 border border-white/10 shadow-xl pointer-events-auto flex items-center gap-2 transition-colors ${
            showHeatmap ? 'text-orange-500' : 'text-zinc-500'
          }`}
        >
          <Flame size={14} />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {showHeatmap ? 'HEATMAP ON' : 'HEATMAP OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};
