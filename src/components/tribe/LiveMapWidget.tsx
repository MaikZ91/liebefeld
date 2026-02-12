import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { TribeEvent } from '@/types/tribe';
import { MapPin, Clock, Radio, ChevronRight } from 'lucide-react';
import { loadLeaflet } from '@/utils/leafletLoader';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';

interface LiveMapWidgetProps {
  events: TribeEvent[];
  selectedCity: string;
  onEventClick?: (event: TribeEvent) => void;
  onExpandMap?: () => void;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Bielefeld': [52.0302, 8.5325],
  'Dortmund': [51.5136, 7.4653],
  'Berlin': [52.5200, 13.4050],
  'Hamburg': [53.5511, 9.9937],
  'Köln': [50.9375, 6.9603],
  'München': [48.1351, 11.5820],
  'Stuttgart': [48.7758, 9.1829],
  'Leipzig': [51.3397, 12.3731],
  'Münster': [51.9607, 7.6261],
  'Deutschland': [51.1657, 10.4515],
};

const getCategoryColor = (category?: string) => {
  const cat = (category || '').toUpperCase();
  if (cat.includes('PARTY') || cat.includes('AUSGEHEN')) return '#f59e0b';
  if (cat.includes('ART') || cat.includes('KREATIVITÄT')) return '#a78bfa';
  if (cat.includes('SPORT')) return '#34d399';
  if (cat.includes('CONCERT') || cat.includes('LIVE')) return '#f472b6';
  return '#d4b483';
};

const getCategoryImage = (category?: string) => {
  const cat = (category || '').toUpperCase();
  if (cat.includes('PARTY') || cat.includes('AUSGEHEN'))
    return 'https://images.unsplash.com/photo-1574391884720-385075a8529e?w=80&h=80&fit=crop';
  if (cat.includes('ART') || cat.includes('KREATIVITÄT'))
    return 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=80&h=80&fit=crop';
  if (cat.includes('SPORT'))
    return 'https://images.unsplash.com/photo-1552674605-469455cad900?w=80&h=80&fit=crop';
  if (cat.includes('CONCERT') || cat.includes('LIVE'))
    return 'https://images.unsplash.com/photo-1459749411177-287ce38e315f?w=80&h=80&fit=crop';
  return 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=80&h=80&fit=crop';
};

const parseEventHour = (timeStr?: string | null): number => {
  if (!timeStr) return 0;
  const match = timeStr.match(/^(\d{1,2})/);
  return match ? parseInt(match[1], 10) : 0;
};

export const LiveMapWidget: React.FC<LiveMapWidgetProps> = ({
  events,
  selectedCity,
  onEventClick,
  onExpandMap,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletReady, setLeafletReady] = useState(typeof (window as any).L !== 'undefined');
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, { lat: number; lng: number }>>(new Map());

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split('T')[0];

  // Time slider: [startHour, endHour] — default shows current hour to +4h
  const [timeWindow, setTimeWindow] = useState<number[]>([
    currentHour,
    Math.min(currentHour + 4, 28), // allow past midnight (24-28 = 0-4 next day concept)
  ]);

  // Format hour for display
  const formatHour = (h: number) => {
    const normalized = h >= 24 ? h - 24 : h;
    return `${normalized.toString().padStart(2, '0')}:00`;
  };

  // Filter to today's events within the time window
  const liveEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.date !== todayStr) return false;
      const hour = parseEventHour(e.time);
      return hour >= timeWindow[0] && hour <= timeWindow[1];
    });
  }, [events, todayStr, timeWindow]);

  // Count of events happening right now (within current hour)
  const happeningNowCount = useMemo(() => {
    return events.filter((e) => {
      if (e.date !== todayStr) return false;
      const hour = parseEventHour(e.time);
      // Consider an event "live" if it started within the last 2 hours
      return hour >= currentHour - 2 && hour <= currentHour;
    }).length;
  }, [events, todayStr, currentHour]);

  // Load Leaflet
  useEffect(() => {
    if (!leafletReady) {
      loadLeaflet().then(() => setLeafletReady(true)).catch(console.error);
    }
  }, [leafletReady]);

  // Batch geocode
  useEffect(() => {
    const uniqueLocations = [...new Set(
      events.filter(e => e.date === todayStr && e.location).map(e => e.location)
    )];
    if (uniqueLocations.length === 0) return;

    supabase.functions.invoke('ai-batch-geocode', {
      body: { locations: uniqueLocations, cityContext: selectedCity }
    }).then(({ data, error }) => {
      if (!error && data?.coordinates) {
        const coordsMap = new Map<string, { lat: number; lng: number }>();
        data.coordinates.forEach((c: any) => {
          if (c.lat && c.lng && c.location) {
            coordsMap.set(c.location.toLowerCase(), { lat: c.lat, lng: c.lng });
          }
        });
        setEventCoordinates(coordsMap);
      }
    }).catch(console.error);
  }, [events, selectedCity, todayStr]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;
    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const coords = CITY_COORDS[selectedCity] || CITY_COORDS['Bielefeld'];
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: true,
      }).setView(coords, 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Don't destroy on every re-render, only on unmount
    };
  }, [leafletReady, selectedCity]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const cityBase = CITY_COORDS[selectedCity] || CITY_COORDS['Bielefeld'];

    liveEvents.forEach((event) => {
      const realCoords = event.location
        ? eventCoordinates.get(event.location.toLowerCase())
        : undefined;

      const coords = realCoords
        ? [realCoords.lat, realCoords.lng]
        : [cityBase[0] + (Math.random() - 0.5) * 0.02, cityBase[1] + (Math.random() - 0.5) * 0.02];

      const color = getCategoryColor(event.category);
      const imgUrl = event.image_url || getCategoryImage(event.category);
      const hour = parseEventHour(event.time);
      const isLiveNow = hour >= currentHour - 2 && hour <= currentHour;

      const icon = L.divIcon({
        className: 'live-map-marker-icon',
        html: `
          <div class="live-marker ${isLiveNow ? 'live-now' : ''}">
            ${isLiveNow ? '<div class="live-pulse" style="border-color: ' + color + '"></div>' : ''}
            <div class="live-marker-inner" style="border-color: ${color}">
              <img src="${imgUrl}" alt="" class="live-marker-img" />
            </div>
          </div>
        `,
        iconSize: [isLiveNow ? 44 : 36, isLiveNow ? 44 : 36],
        iconAnchor: [isLiveNow ? 22 : 18, isLiveNow ? 22 : 18],
      });

      const marker = L.marker(coords, { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px; padding: 8px;">
          <div style="font-weight: 600; color: #fff; font-size: 13px; margin-bottom: 4px;">${event.title}</div>
          <div style="color: #a1a1aa; font-size: 11px;">🕐 ${event.time || '?'}${event.location ? ' • 📍 ' + event.location : ''}</div>
          ${isLiveNow ? '<div style="color: #22c55e; font-size: 10px; margin-top: 4px; font-weight: 600;">● JETZT LIVE</div>' : ''}
        </div>
      `, {
        className: 'event-popup-container',
        maxWidth: 260,
      });

      if (onEventClick) {
        marker.on('click', () => onEventClick(event));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 1) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 15 });
    }
  }, [liveEvents, eventCoordinates, leafletReady, selectedCity, currentHour, onEventClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mx-6 mb-6">
      {/* Widget Container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-[401] p-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio size={14} className="text-green-400" />
                {happeningNowCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">Live Map</span>
              {happeningNowCount > 0 && (
                <span className="text-[10px] text-green-400 font-medium">
                  {happeningNowCount} jetzt live
                </span>
              )}
            </div>
            {onExpandMap && (
              <button
                onClick={onExpandMap}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-gold transition-colors uppercase tracking-wider"
              >
                Vollbild
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        <div ref={mapRef} className="w-full h-[220px]" />

        {/* Time Slider Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-[401] bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 pt-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={12} className="text-zinc-400 shrink-0" />
            <span className="text-[10px] text-zinc-400 font-medium shrink-0">
              {formatHour(timeWindow[0])}
            </span>
            <Slider
              value={timeWindow}
              min={0}
              max={28}
              step={1}
              onValueChange={(val) => setTimeWindow(val)}
              className="flex-1"
            />
            <span className="text-[10px] text-zinc-400 font-medium shrink-0">
              {formatHour(timeWindow[1])}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              {liveEvents.length} Events im Zeitfenster
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setTimeWindow([currentHour, Math.min(currentHour + 4, 28)])}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all",
                  timeWindow[0] === currentHour && timeWindow[1] === Math.min(currentHour + 4, 28)
                    ? "bg-gold text-black"
                    : "bg-white/5 text-zinc-500 hover:bg-white/10"
                )}
              >
                Jetzt
              </button>
              <button
                onClick={() => setTimeWindow([18, 28])}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all",
                  timeWindow[0] === 18 && timeWindow[1] === 28
                    ? "bg-gold text-black"
                    : "bg-white/5 text-zinc-500 hover:bg-white/10"
                )}
              >
                Abend
              </button>
              <button
                onClick={() => setTimeWindow([0, 28])}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all",
                  timeWindow[0] === 0 && timeWindow[1] === 28
                    ? "bg-gold text-black"
                    : "bg-white/5 text-zinc-500 hover:bg-white/10"
                )}
              >
                Ganzer Tag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for live markers */}
      <style>{`
        .live-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .live-marker-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2.5px solid;
          overflow: hidden;
          background: #18181b;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .live-marker-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .live-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid;
          animation: live-pulse-anim 2s ease-out infinite;
          pointer-events: none;
        }
        .live-now .live-marker-inner {
          box-shadow: 0 0 16px rgba(34, 197, 94, 0.5);
        }
        @keyframes live-pulse-anim {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
