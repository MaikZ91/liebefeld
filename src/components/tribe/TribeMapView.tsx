import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { TribeEvent } from '@/types/tribe';
import { Clock, MapPin, Navigation, Radio, Users, ChevronUp, ChevronDown, X, Compass } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { loadLeaflet } from '@/utils/leafletLoader';
import { batchGeocodeWithCache } from '@/services/geocodingService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { LocationSharingPanel } from './map/LocationSharingPanel';
import { PingPanel } from './map/PingPanel';
import { DiscoveryPanel } from './map/DiscoveryPanel';
import { useToast } from '@/hooks/use-toast';

interface TribeMapViewProps {
  events: TribeEvent[];
  posts?: any[];
  selectedCity: string;
  onEventClick?: (event: TribeEvent) => void;
  userProfile?: { username: string; avatarUrl?: string; interests?: string[] };
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

type ActivePanel = 'none' | 'location' | 'ping' | 'discovery';

interface PingMessage {
  id: string;
  sender: string;
  senderAvatar?: string;
  message: string;
  location?: { lat: number; lng: number };
  locationName?: string;
  timestamp: Date;
  respondents: Array<{ username: string; avatar?: string }>;
}

interface NearbyUser {
  id: string;
  username: string;
  avatar?: string;
  status?: string;
  distance?: number;
  lastSeen: Date;
  interests?: string[];
  location?: { lat: number; lng: number };
}

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

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const TribeMapView: React.FC<TribeMapViewProps> = ({ 
  events, 
  selectedCity, 
  onEventClick,
  userProfile 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const nearbyMarkersRef = useRef<any[]>([]);
  const { toast } = useToast();
  
  const now = new Date();
  const currentHour = now.getHours();
  const [timeWindow, setTimeWindow] = useState<number[]>([currentHour, Math.min(currentHour + 6, 28)]);
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, {lat: number, lng: number}>>(new Map());
  const [leafletReady, setLeafletReady] = useState(typeof (window as any).L !== 'undefined');
  
  // Location sharing state
  const [isSharing, setIsSharing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [userStatus, setUserStatus] = useState('');
  const [shareUntil, setShareUntil] = useState<Date | undefined>();
  
  // Panels state
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  
  // Pings state
  const [activePings, setActivePings] = useState<PingMessage[]>([]);
  
  // Discovery state
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);

  // Load Leaflet dynamically when component mounts
  useEffect(() => {
    if (!leafletReady) {
      loadLeaflet().then(() => setLeafletReady(true)).catch(console.error);
    }
  }, [leafletReady]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Standort nicht verfügbar",
        description: "Dein Browser unterstützt keine Standortabfrage.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Center map on user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1 });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Standort nicht verfügbar",
          description: "Bitte aktiviere die Standortfreigabe.",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  // Handle location sharing toggle
  const handleToggleSharing = async (share: boolean) => {
    if (share && !userLocation) {
      getCurrentLocation();
    }
    
    setIsSharing(share);
    
    if (share && userProfile) {
      // Save location to database
      try {
        await supabase
          .from('user_profiles')
          .update({
            current_live_location_lat: userLocation?.lat,
            current_live_location_lng: userLocation?.lng,
            current_status_message: userStatus,
            current_checkin_timestamp: new Date().toISOString()
          })
          .eq('username', userProfile.username);
        
        toast({
          title: "Standort wird geteilt",
          description: "Andere können dich jetzt auf der Map sehen.",
        });
      } catch (error) {
        console.error('Failed to share location:', error);
      }
    } else if (!share && userProfile) {
      // Clear location from database
      try {
        await supabase
          .from('user_profiles')
          .update({
            current_live_location_lat: null,
            current_live_location_lng: null,
            current_status_message: null,
            current_checkin_timestamp: null
          })
          .eq('username', userProfile.username);
          
        toast({
          title: "Standort versteckt",
          description: "Du bist jetzt nicht mehr sichtbar.",
        });
      } catch (error) {
        console.error('Failed to hide location:', error);
      }
    }
  };

  // Set share duration
  const handleSetShareDuration = (hours: number) => {
    const until = new Date();
    until.setHours(until.getHours() + hours);
    setShareUntil(until);
  };

  // Load nearby users from database
  useEffect(() => {
    const loadNearbyUsers = async () => {
      if (!userLocation) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .not('current_live_location_lat', 'is', null)
          .not('current_live_location_lng', 'is', null);
        
        if (error) throw error;
        
        const users: NearbyUser[] = (data || [])
          .filter(u => u.username !== userProfile?.username)
          .map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar || undefined,
            status: u.current_status_message || undefined,
            distance: userLocation ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              u.current_live_location_lat!,
              u.current_live_location_lng!
            ) : undefined,
            lastSeen: new Date(u.current_checkin_timestamp || u.last_online || new Date()),
            interests: u.interests || undefined,
            location: u.current_live_location_lat && u.current_live_location_lng
              ? { lat: u.current_live_location_lat, lng: u.current_live_location_lng }
              : undefined
          }));
        
        setNearbyUsers(users);
      } catch (error) {
        console.error('Failed to load nearby users:', error);
      }
    };
    
    loadNearbyUsers();
    const interval = setInterval(loadNearbyUsers, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, [userLocation, userProfile?.username]);

  // Handle sending a ping
  const handleSendPing = async (message: string, location?: { lat: number; lng: number }) => {
    if (!userProfile) return;
    
    const newPing: PingMessage = {
      id: Date.now().toString(),
      sender: userProfile.username,
      senderAvatar: userProfile.avatarUrl,
      message,
      location,
      timestamp: new Date(),
      respondents: []
    };
    
    setActivePings(prev => [newPing, ...prev]);
    
    // Save ping to chat_messages with special format
    try {
      await supabase.from('chat_messages').insert({
        group_id: 'tribe_pings',
        sender: userProfile.username,
        text: `📍 PING: ${message}`,
        avatar: userProfile.avatarUrl,
        meetup_responses: {}
      });
      
      toast({
        title: "Ping gesendet!",
        description: "Andere in der Nähe können jetzt antworten.",
      });
    } catch (error) {
      console.error('Failed to send ping:', error);
    }
  };

  // Handle responding to a ping
  const handleRespondToPing = (pingId: string) => {
    if (!userProfile) return;
    
    setActivePings(prev => prev.map(ping => {
      if (ping.id === pingId) {
        const alreadyResponded = ping.respondents.some(r => r.username === userProfile.username);
        if (alreadyResponded) {
          return {
            ...ping,
            respondents: ping.respondents.filter(r => r.username !== userProfile.username)
          };
        } else {
          return {
            ...ping,
            respondents: [...ping.respondents, { username: userProfile.username, avatar: userProfile.avatarUrl }]
          };
        }
      }
      return ping;
    }));
  };

  const formatHour = (h: number) => {
    const normalized = h >= 24 ? h - 24 : h;
    return `${normalized.toString().padStart(2, '0')}:00`;
  };

  // Filter events: today only, within time window, exclude past
  const filteredEvents = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDate = parseDateString(event.date);
      if (!eventDate) return false;
      const eDateStr = eventDate.toISOString().split('T')[0];
      if (eDateStr !== todayStr) return false;
      
      // Parse event hour
      const timeMatch = event.time?.match(/^(\d{1,2})/);
      const eventHour = timeMatch ? parseInt(timeMatch[1], 10) : 0;
      
      // Must be within slider range and not in the past
      return eventHour >= timeWindow[0] && eventHour <= timeWindow[1] && eventHour >= currentHour - 2;
    });
  }, [events, timeWindow, currentHour]);

  // Batch-Geocoding with cache + hardcoded + AI fallback
  useEffect(() => {
    const loadAllCoordinates = async () => {
      const uniqueLocations = [...new Set(
        events.filter(e => e.location).map(e => e.location)
      )] as string[];
      
      if (uniqueLocations.length === 0) return;
      
      try {
        const coordsMap = await batchGeocodeWithCache(uniqueLocations, selectedCity);
        setEventCoordinates(coordsMap);
      } catch (err) {
        console.error('Failed to batch geocode:', err);
      }
    };
    
    loadAllCoordinates();
  }, [events, selectedCity]);

  // Initialize and update map
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;

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

    // Clear existing markers (except user marker)
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
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

    // Add nearby user markers
    nearbyMarkersRef.current.forEach(m => map.removeLayer(m));
    nearbyMarkersRef.current = [];

    nearbyUsers.forEach(user => {
      if (!user.location) return;
      
      const icon = L.divIcon({
        className: 'user-marker-icon',
        html: `
          <div class="user-map-marker">
            <div class="user-marker-avatar" style="background-image: url('${user.avatar || ''}')">
              ${!user.avatar ? `<span>${user.username[0]?.toUpperCase()}</span>` : ''}
            </div>
            ${user.status ? `<div class="user-marker-status">${user.status}</div>` : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([user.location.lat, user.location.lng], { icon }).addTo(map);
      nearbyMarkersRef.current.push(marker);
    });

    // Add or update user's own location marker
    if (isSharing && userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-self-marker-icon',
          html: `
            <div class="user-self-marker">
              <div class="pulse-ring"></div>
              <div class="user-self-avatar" style="background-image: url('${userProfile?.avatarUrl || ''}')">
                ${!userProfile?.avatarUrl ? `<span>${userProfile?.username?.[0]?.toUpperCase() || 'U'}</span>` : ''}
              </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
      }
    } else if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Fly to city
    if (selectedCity !== 'All' && CITY_COORDS[selectedCity]) {
      map.flyTo(CITY_COORDS[selectedCity], 13, { duration: 1.5 });
    }

  }, [filteredEvents, eventCoordinates, selectedCity, onEventClick, leafletReady, isSharing, userLocation, nearbyUsers, userProfile]);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

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
        
        /* User markers */
        .user-map-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .user-marker-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #22c55e;
          background-color: #27272a;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
        }
        .user-marker-avatar span {
          color: #a1a1aa;
          font-size: 14px;
          font-weight: 600;
        }
        .user-marker-status {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          white-space: nowrap;
          margin-top: 4px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* User self marker */
        .user-self-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-ring {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid hsl(var(--gold));
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .user-self-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid hsl(var(--gold));
          background-color: #18181b;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .user-self-avatar span {
          color: hsl(var(--gold));
          font-size: 16px;
          font-weight: 700;
        }
      `}</style>
      
      <div id="map" ref={mapRef} className="h-full w-full"></div>
      
      {/* Top Left: Time Slider */}
      <div className="absolute top-4 left-4 right-20 z-[400] pointer-events-none">
        <div className="bg-black/90 backdrop-blur-md px-4 py-3 border border-white/10 shadow-xl pointer-events-auto rounded-xl max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-gold" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Heute</span>
            <span className="text-[10px] text-zinc-500 ml-auto">{filteredEvents.length} Events</span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-zinc-400 font-medium w-10 shrink-0">
              {formatHour(timeWindow[0])}
            </span>
            <Slider
              value={timeWindow}
              min={currentHour}
              max={28}
              step={1}
              onValueChange={(val) => setTimeWindow(val)}
              className="flex-1"
            />
            <span className="text-[10px] text-zinc-400 font-medium w-10 shrink-0 text-right">
              {formatHour(timeWindow[1])}
            </span>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setTimeWindow([currentHour, Math.min(currentHour + 4, 28)])}
              className={cn(
                "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all",
                timeWindow[0] === currentHour && timeWindow[1] === Math.min(currentHour + 4, 28)
                  ? "bg-gold text-black"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              Jetzt
            </button>
            <button
              onClick={() => setTimeWindow([18, 28])}
              className={cn(
                "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all",
                timeWindow[0] === 18 && timeWindow[1] === 28
                  ? "bg-gold text-black"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              Abend
            </button>
            <button
              onClick={() => setTimeWindow([0, 28])}
              className={cn(
                "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all",
                timeWindow[0] === 0 && timeWindow[1] === 28
                  ? "bg-gold text-black"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              Alle
            </button>
          </div>
          
          {nearbyUsers.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-zinc-400">
              <Users size={12} className="text-green-500" />
              <span className="text-[10px]">{nearbyUsers.length} aktiv in der Nähe</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Action Buttons */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        {/* My Location Button */}
        <button
          onClick={getCurrentLocation}
          className="w-12 h-12 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <Compass size={20} className="text-white" />
        </button>
        
        {/* Location Sharing Button */}
        <button
          onClick={() => togglePanel('location')}
          className={cn(
            "w-12 h-12 backdrop-blur-md border rounded-xl flex items-center justify-center transition-all relative",
            activePanel === 'location' 
              ? "bg-gold border-gold text-black" 
              : isSharing 
                ? "bg-green-500/20 border-green-500 text-green-500"
                : "bg-black/90 border-white/10 text-white hover:bg-white/10"
          )}
        >
          <Navigation size={20} />
          {isSharing && activePanel !== 'location' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>
        
        {/* Ping Button */}
        <button
          onClick={() => togglePanel('ping')}
          className={cn(
            "w-12 h-12 backdrop-blur-md border rounded-xl flex items-center justify-center transition-all relative",
            activePanel === 'ping' 
              ? "bg-gold border-gold text-black" 
              : "bg-black/90 border-white/10 text-white hover:bg-white/10"
          )}
        >
          <Radio size={20} />
          {activePings.length > 0 && activePanel !== 'ping' && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{activePings.length}</span>
            </div>
          )}
        </button>
        
        {/* Discovery Button */}
        <button
          onClick={() => togglePanel('discovery')}
          className={cn(
            "w-12 h-12 backdrop-blur-md border rounded-xl flex items-center justify-center transition-all relative",
            activePanel === 'discovery' 
              ? "bg-gold border-gold text-black" 
              : "bg-black/90 border-white/10 text-white hover:bg-white/10"
          )}
        >
          <Users size={20} />
          {nearbyUsers.length > 0 && activePanel !== 'discovery' && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{nearbyUsers.length}</span>
            </div>
          )}
        </button>
      </div>

      {/* Sliding Panels */}
      <div className={cn(
        "absolute top-4 right-20 z-[399] w-80 max-w-[calc(100vw-120px)] transition-all duration-300",
        activePanel !== 'none' ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
      )}>
        {activePanel === 'location' && (
          <LocationSharingPanel
            isSharing={isSharing}
            onToggleSharing={handleToggleSharing}
            onUpdateStatus={setUserStatus}
            currentStatus={userStatus}
            shareUntil={shareUntil}
            onSetShareDuration={handleSetShareDuration}
          />
        )}
        
        {activePanel === 'ping' && userProfile && (
          <PingPanel
            userProfile={userProfile}
            onSendPing={handleSendPing}
            activePings={activePings}
            onRespondToPing={handleRespondToPing}
            userLocation={userLocation}
          />
        )}
        
        {activePanel === 'discovery' && (
          <DiscoveryPanel
            nearbyUsers={nearbyUsers}
            onUserClick={(id) => console.log('View user:', id)}
            onMessageUser={(id) => console.log('Message user:', id)}
            userInterests={userProfile?.interests}
          />
        )}
      </div>

      {/* Bottom Status Bar when sharing */}
      {isSharing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto">
          <div className="bg-green-500/20 backdrop-blur-md border border-green-500/50 rounded-full px-4 py-2 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-medium">Location aktiv</span>
            {userStatus && (
              <>
                <span className="text-green-600">•</span>
                <span className="text-sm text-green-300">{userStatus}</span>
              </>
            )}
            <button
              onClick={() => handleToggleSharing(false)}
              className="ml-2 p-1 hover:bg-green-500/30 rounded-full transition-all"
            >
              <X size={14} className="text-green-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
