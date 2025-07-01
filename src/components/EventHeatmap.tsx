// src/components/EventHeatmap.tsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Calendar, Users, Clock, ChevronDown, ChevronUp, X, Sparkles, Plus, CheckCircle, Send, Filter, FilterX, MessageSquare } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import SwipeableEventPanel from '@/components/event-chat/SwipeableEventPanel';
import { PanelEventData, PanelEvent } from '@/components/event-chat/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EventForm from '@/components/EventForm';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { messageService } from '@/services/messageService';
import { Input } from '@/components/ui/input';
import { UserProfile } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import PrivateChat from '@/components/users/PrivateChat';
import HeatmapHeader from './HeatmapHeader';
import { useEventContext, cities } from '@/contexts/EventContext';
import FullPageChatBot from '@/components/event-chat/FullPageChatBot';
import { useChatLogic } from '@/components/event-chat/useChatLogic';
import { geocodeLocation, loadCachedCoordinates, geocodeMultipleLocations } from '@/services/geocodingService';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventHeatmap: React.FC = () => {
  const { events, isLoading, refreshEvents } = useEvents();
  const { selectedCity } = useEventContext();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState([new Date().getHours()]);
  const [map, setMap] = useState<L.Map | null>(null);
  const [eventMarkers, setEventMarkers] = useState<L.Marker[]>([]);
  const [userMarkers, setUserMarkers] = useState<L.Marker[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState<'collapsed' | 'partial' | 'full'>('collapsed');
  const [perfectDayMessage, setPerfectDayMessage] = useState<string | null>(null);
  const [isPerfectDayLoading, setIsPerfectDayLoading] = useState(false);
  const [showPerfectDayPanel, setShowPerfectDayPanel] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [liveStatusMessage, setLiveStatusMessage] = useState('');
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [selectedUserForPrivateChat, setSelectedUserForPrivateChat] = useState<UserProfile | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // New state for central avatar
  const [showCentralAvatar, setShowCentralAvatar] = useState(false);
  const [centralAvatarUsername, setCentralAvatarUsername] = useState('');
  const [centralAvatarImage, setCentralAvatarImage] = useState('');

  // New state for AI Chat integration
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');

  // State for geocoded coordinates
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, { lat: number; lng: number }>>(new Map());

  // Initialize chat logic for AI chat
  const chatLogic = useChatLogic();

  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  // Load cached coordinates on component mount
  useEffect(() => {
    loadCachedCoordinates();
  }, []);

  // Geocode all event locations when events change
  useEffect(() => {
    const geocodeEventLocations = async () => {
      if (!events.length) return;

      console.log('[EventHeatmap] Starting geocoding for events...');
      
      // Sammle alle einzigartigen Locations
      const uniqueLocations = new Set<string>();
      const locationData: Array<{ location: string; city?: string }> = [];

      events.forEach(event => {
        if (event.location && !uniqueLocations.has(event.location)) {
          uniqueLocations.add(event.location);
          locationData.push({
            location: event.location,
            city: event.city || selectedCity
          });
        }
      });

      if (locationData.length === 0) return;

      try {
        // Batch-Geocoding für bessere Performance
        const coordinates = await geocodeMultipleLocations(locationData);
        
        // Erstelle neue Koordinaten-Map für Events
        const newEventCoordinates = new Map<string, { lat: number; lng: number }>();
        
        events.forEach(event => {
          if (event.location) {
            const key = `${event.location}_${event.city || selectedCity}`;
            const coords = coordinates.get(key);
            if (coords) {
              newEventCoordinates.set(event.id, {
                lat: coords.lat,
                lng: coords.lng
              });
            }
          }
        });

        setEventCoordinates(newEventCoordinates);
        console.log(`[EventHeatmap] Geocoded ${newEventCoordinates.size} event locations`);
      } catch (error) {
        console.error('[EventHeatmap] Error during batch geocoding:', error);
      }
    };

    geocodeEventLocations();
  }, [events, selectedCity]);

  const getTimeFromSlider = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getHourFromTime = (timeString: string): number => {
    const [hour] = timeString.split(':');
    return parseInt(hour, 10);
  };

  const getCityCenterCoordinates = (cityAbbr: string) => {
    const cityObject = cities.find(c => c.abbr.toLowerCase() === cityAbbr.toLowerCase());
    if (cityObject) {
      const coords: { [key: string]: { lat: number; lng: number } } = {
        'bi': { lat: 52.0302, lng: 8.5311 },
        'bielefeld': { lat: 52.0302, lng: 8.5311 },
        'berlin': { lat: 52.5200, lng: 13.4050 },
        'hamburg': { lat: 53.5511, lng: 9.9937 },
        'köln': { lat: 50.935173, lng: 6.953101 },
        'munich': { lat: 48.1351, lng: 11.5820 },
      };
      return coords[cityObject.abbr.toLowerCase()] || { lat: 52.0302, lng: 8.5311 };
    }
    return { lat: 52.0302, lng: 8.5311 };
  };

  const todaysFilteredEvents = React.useMemo(() => {
    const cityDisplayName = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity;
    console.log(`Filtering events for today (${today}) in ${cityDisplayName}...`);
    
    const filtered = events
      .filter(event => {
        const isTodayEvent = event.date === today;
        const hasLocationData = event.location || event.city;
        
        const eventCityLower = event.city ? event.city.toLowerCase() : null;
        const selectedCityLower = selectedCity.toLowerCase();

        let isRelevantCity = false;
        if (selectedCityLower === 'bi' || selectedCityLower === 'bielefeld') {
          isRelevantCity = !eventCityLower || eventCityLower === 'bielefeld' || eventCityLower === 'bi';
        } else {
          isRelevantCity = eventCityLower === selectedCityLower;
        }
                                       
        console.log(`Event: ${event.title}, Date: ${event.date}, Location: ${event.location}, City: ${event.city}, IsToday: ${isTodayEvent}, HasLocation: ${hasLocationData}, IsRelevantCity: ${isRelevantCity}`);
        
        return isTodayEvent && hasLocationData && isRelevantCity;
      })
      .map(event => {
        // Verwende geocodierte Koordinaten falls verfügbar
        const coords = eventCoordinates.get(event.id);
        const lat = coords?.lat || getCityCenterCoordinates(selectedCity).lat;
        const lng = coords?.lng || getCityCenterCoordinates(selectedCity).lng;
        
        return {
          ...event,
          lat,
          lng,
          attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0),
          eventHour: getHourFromTime(event.time)
        };
      });

    console.log(`Found ${filtered.length} events for today in ${cityDisplayName} with coordinates`);
    return filtered;
  }, [events, today, selectedCity, eventCoordinates]);

  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    todaysFilteredEvents.forEach(event => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: todaysFilteredEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
  }, [todaysFilteredEvents]);

  const filteredEvents = React.useMemo(() => {
    let filtered = todaysFilteredEvents;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    const selectedHour = timeRange[0];
    filtered = filtered.filter(event => event.eventHour >= selectedHour);
    
    return filtered;
  }, [todaysFilteredEvents, selectedCategory, timeRange]);

  const panelEvents: PanelEvent[] = React.useMemo(() => {
    return filteredEvents.map(event => ({
      id: event.id || `${event.title}-${event.date}-${event.time}`,
      title: event.title,
      date: event.date,
      time: event.time,
      price: event.is_paid ? "Kostenpflichtig" : "Kostenlos",
      location: event.location || event.city || 'Unknown Location',
      image_url: event.image_url || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop&q=80&auto=format`,
      category: event.category,
      link: event.link,
      likes: event.likes || 0,
      rsvp_yes: event.rsvp_yes,
      rsvp_maybe: event.rsvp_maybe
    }));
  }, [filteredEvents]);

  const panelData: PanelEventData = React.useMemo(() => {
    const selectedIndex = selectedEventId
      ? panelEvents.findIndex(event => event.id === selectedEventId)
      : 0;
    
    return {
      events: panelEvents,
      currentIndex: selectedIndex >= 0 ? selectedIndex : 0
    };
  }, [panelEvents, selectedEventId]);

  const generatePerfectDay = async () => {
    setIsPerfectDayLoading(true);
    try {
      const username = localStorage.getItem('community_chat_username') || 'Gast';
      const userInterests = JSON.parse(localStorage.getItem('user_interests') || '[]');
      const userLocations = JSON.parse(localStorage.getItem('user_locations') || '[]');
      const weather = sessionStorage.getItem('weather') || 'partly_cloudy';

      const { data, error } = await supabase.functions.invoke('generate-perfect-day', {
        body: {
          username,
          weather,
          interests: userInterests,
          favorite_locations: userLocations
        }
      });

      if (error) throw error;

      setPerfectDayMessage(data.response);
      setShowPerfectDayPanel(true);
      
      toast({
        title: "Perfect Day generiert!",
        description: "Deine personalisierte Tagesempfehlung ist bereit.",
      });
    } catch (error: any) {
      console.error('Error generating Perfect Day:', error);
      toast({
        title: "Fehler",
        description: "Perfect Day konnte nicht generiert werden: " + (error.message || "Unbekannter Fehler."),
        variant: "destructive"
      });
    } finally {
      setIsPerfectDayLoading(false);
    }
  };

  const updateUserPosition = async (username: string, newLat: number, newLng: number) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_live_location_lat: newLat,
          current_live_location_lng: newLng,
          last_online: new Date().toISOString()
        })
        .eq('username', username);
      
      if (error) throw error;
      
      console.log(`Updated position for ${username} to ${newLat}, ${newLng}`);
    } catch (error: any) {
      console.error('Error updating user position:', error);
      toast({
        title: "Fehler",
        description: "Position konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  // Updated check-in function to show central avatar
  const handleCheckInWithStatus = async () => {
    const username = currentUser || localStorage.getItem('community_chat_username') || 'Gast';
    const avatar = userProfile?.avatar || localStorage.getItem('community_chat_avatar') || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;
    
    // Set central avatar data
    setCentralAvatarUsername(username);
    setCentralAvatarImage(avatar);
    setShowCentralAvatar(true);
    
    const checkInToast = toast({ 
      title: "Check-in wird verarbeitet...", 
      duration: Infinity 
    });

    try {
      const userCurrentCityCenter = getCityCenterCoordinates(selectedCity);
      const userCurrentLat = userCurrentCityCenter.lat + (Math.random() - 0.5) * 0.005;
      const userCurrentLng = userCurrentCityCenter.lng + (Math.random() - 0.5) * 0.005;

      // Only update database if user is logged in
      if (currentUser && currentUser !== 'Gast') {
        const updatedProfileData: Partial<UserProfile> = {
          last_online: new Date().toISOString(),
          current_live_location_lat: userCurrentLat,
          current_live_location_lng: userCurrentLng,
          current_status_message: liveStatusMessage,
          current_checkin_timestamp: new Date().toISOString(),
        };
        
        await supabase.from('user_profiles')
          .update(updatedProfileData)
          .eq('username', currentUser);
        
        refetchProfile();
      }

      // Send community message for all users
      const communityMessage = liveStatusMessage
        ? `📍 ${username} ist jetzt hier: "${liveStatusMessage}"`
        : `📍 ${username} ist jetzt in der Nähe!`;
      
      const cityCommunityGroupId = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.abbr.toLowerCase() + '_ausgehen' || 'bi_ausgehen';

      await messageService.sendMessage(
        cityCommunityGroupId,
        username,
        communityMessage,
        avatar
      );

      toast({
        title: "Erfolgreich eingecheckt!",
        description: liveStatusMessage ? `Dein Status: "${liveStatusMessage}" wurde geteilt.` : "Dein Standort wurde geteilt.",
      });

      // Add user marker to map immediately
      if (map) {
        const userIconHtml = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: auto;
            min-width: 80px;
            max-width: 150px;
            cursor: move;
          ">
            <div style="
              background: #ef4444;
              color: white;
              padding: 4px 8px;
              border-radius: 15px;
              font-size: 11px;
              font-weight: 500;
              margin-bottom: 5px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              position: relative;
              top: 5px;
            ">
              ${liveStatusMessage}
            </div>
            <img src="${avatar}"
                 alt="${username}"
                 style="
                   width: 50px;
                   height: 50px;
                   border-radius: 50%;
                   border: 3px solid white;
                   box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                   background-color: white;
                   position: relative;
                   z-index: 10;
                 "/>
            <div style="
              color: #333;
              font-size: 10px;
              font-weight: bold;
              margin-top: 2px;
            ">
              ${username}
            </div>
          </div>
        `;

        const userMarkerIcon = L.divIcon({
          html: userIconHtml,
          className: 'user-marker',
          iconSize: [60, 90],
          iconAnchor: [30, 90],
        });

        const marker = L.marker([userCurrentLat, userCurrentLng], { 
          icon: userMarkerIcon,
          draggable: true
        });
        
        marker.on('dragend', (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          console.log(`User ${username} moved to:`, position.lat, position.lng);
          
          if (currentUser && currentUser !== 'Gast') {
            updateUserPosition(username, position.lat, position.lng);
          }
        });

        map.addLayer(marker);
        setUserMarkers(prev => [...prev, marker]);
      }

    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({
        title: "Fehler",
        description: error.message || "Es gab ein Problem beim Einchecken.",
        variant: "destructive"
      });
    } finally {
      setLiveStatusMessage('');
    }
  };

  const goToChat = () => {
    window.location.href = '/chat';
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .insert([{
          ...eventData,
          city: cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Event erfolgreich erstellt!",
        description: `${eventData.title} wurde hinzugefügt.`,
      });
      refreshEvents();
      setIsEventFormOpen(false);
    } catch (error: any) {
      console.error('Error adding event:', error);
      toast({
        title: "Fehler",
        description: "Event konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) {
      if (map) {
        map.remove();
        setMap(null);
      }
      return;
    }

    if (map) {
      map.remove();
      setMap(null);
    }
    
    const initialCenter = getCityCenterCoordinates(selectedCity);

    const leafletMap = L.map(mapRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: 13,
      zoomControl: true,
      preferCanvas: false
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      if (leafletMap) {
        leafletMap.remove();
      }
    };
  }, [mapRef.current, selectedCity]);

  useEffect(() => {
    if (!map) {
      eventMarkers.forEach(marker => {
        try { map?.removeLayer(marker); } catch (e) {}
      });
      setEventMarkers([]);
      return;
    }

    const markersToRemove = [...eventMarkers];
    markersToRemove.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    const newEventMarkers: L.Marker[] = [];
    const currentPlacedCoords = new Map<string, number>(); // Reset for each effect run

    filteredEvents.forEach(event => {
      // Verwende geocodierte Koordinaten
      const coords = eventCoordinates.get(event.id);
      let lat = coords?.lat || event.lat;
      let lng = coords?.lng || event.lng;

      if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
        console.warn(`Invalid coordinates for event ${event.title}: Lat ${lat}, Lng ${lng}. Skipping marker.`);
        return;
      }

      // Logic to distribute overlapping markers
      const originalKey = `${lat}-${lng}`;
      let offsetCount = currentPlacedCoords.get(originalKey) || 0;

      if (offsetCount > 0) {
        const offsetMagnitude = 0.00005; // A small value for meters, adjust as needed
        const angle = Math.random() * 2 * Math.PI; // Random angle for distribution
        const distance = offsetMagnitude * Math.sqrt(offsetCount); // Increase distance slightly for more overlaps

        lat += distance * Math.cos(angle);
        lng += distance * Math.sin(angle);
      }
      currentPlacedCoords.set(originalKey, offsetCount + 1);
      // End of new distribution logic

      const likes = event.likes || 0;
      let markerSize = 60;
      const imageSize = 40;

      const iconHtml = `
        <div style="
          background: rgba(0,0,0,0.8);
          color: white;
          border-radius: 8px;
          width: ${markerSize}px;
          height: ${markerSize + 20}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 5px;
          border: 2px solid #ef4444;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          font-family: sans-serif;
          overflow: hidden;
        ">
          <img src="${event.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop;'}"
               onerror="this.src='https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';"
               style="width: ${imageSize}px; height: ${imageSize}px; object-fit: cover; border-radius: 4px; margin-bottom: 4px;"/>
          <div style="
            font-size: 9px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            text-align: center;
          ">
            ${event.title}
          </div>
          <div style="font-size: 8px; margin-top: 2px; display: flex; align-items: center; justify-content: center; color: #ff9999;">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              ${likes}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-event-marker',
        iconSize: [markerSize, markerSize + 20],
        iconAnchor: [markerSize / 2, markerSize + 20],
        popupAnchor: [0, -markerSize - 20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedEventId(event.id);
        setIsPanelOpen(true);
        setPanelHeight('partial');
        setShowPerfectDayPanel(false);
      });

      const popupContent = `
        <div style="min-width: 200px; max-width: 250px; font-family: sans-serif;">
          ${event.image_url ? `<img src="${event.image_url}" onerror="this.src='https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"/>` : ''}
          <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${event.title}</h3>
          
          <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 12px;">
            <span style="margin-right: 5px;">📍</span>
            <span>${event.location || 'Bielefeld'}</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 12px;">
            <span style="margin-right: 5px;">📅</span>
            <span>Heute, ${event.time} Uhr</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280; font-size: 12px;">
            <span style="margin-right: 5px;">❤️</span>
            <span>${event.likes || 0} Likes</span>
          </div>
          ${event.description ? `<p style="margin-bottom: 8px; font-size: 11px; color: #4b5563; max-height: 60px; overflow: hidden;">${event.description}</p>` : ''}
          <div style="
            background: #ef4444;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
          ">
            ${event.category}
          </div>
          ${event.link ? `<div style="margin-top: 8px;"><a href="${event.link}" target="_blank" style="color: #ef4444; text-decoration: underline; font-size: 12px;">Mehr Info</a></div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      newEventMarkers.push(marker);
    });

    setEventMarkers(newEventMarkers);

    return () => {
      newEventMarkers.forEach(marker => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, filteredEvents, selectedCity, eventCoordinates]);

  // ... (restlicher Code der Komponente)