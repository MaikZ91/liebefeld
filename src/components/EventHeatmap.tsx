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
import { MapPin, Calendar, Users, Clock, ChevronDown, ChevronUp, X, Sparkles, Plus, CheckCircle, Send, Filter, FilterX, MessageSquare, CalendarIcon } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';

import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ThreeEventDisplay from '@/components/event-chat/ThreeEventDisplay';
import { PanelEventData, PanelEvent } from '@/components/event-chat/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
import TribeFinder from './TribeFinder';
import { eventChatService } from '@/services/eventChatService';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define tribeSpots outside the component to ensure it's a constant and accessible
const tribeSpots = [
  { name: 'Sparrenburg', lat: 52.0149, lng: 8.52678 },
  { name: 'Obersee', lat: 52.056974, lng: 8.563763 },
  { name: 'Lutterviertel', lat: 52.0289, lng: 8.5291 },
  { name: 'Gellershagen Park', lat: 52.05, lng: 8.5167 },
  { name: 'Klosterplatz', lat: 52.0208, lng: 8.5286 },
  { name: 'Nordpark', lat: 52.0368, lng: 8.5290 },
  { name: 'Universität Bielefeld', lat: 52.0378, lng: 8.4931 },
{ name: 'Schwedenschanze', lat: 52.068540, lng: 8.369610 }
];

const EventHeatmap: React.FC = () => {
  const { selectedCity } = useEventContext();
  const { events, isLoading, refreshEvents, addUserEvent, handleLikeEvent } = useEvents(selectedCity);
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState([new Date().getHours()]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [map, setMap] = useState<L.Map | null>(null);
  const [eventMarkers, setEventMarkers] = useState<L.Marker[]>([]);
  const [tribeSpotMarkers, setTribeSpotMarkers] = useState<L.Marker[]>([]);
  const currentTribeSpotMarkersRef = useRef<L.Marker[]>();
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
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [isTribeFinderOpen, setIsTribeFinderOpen] = useState(false);

  // Declare central avatar states at the top level to ensure scope
  const [centralAvatarUsername, setCentralAvatarUsername] = useState('');
  const [centralAvatarImage, setCentralAvatarImage] = useState('');
  const [showCentralAvatar, setShowCentralAvatar] = useState(false);

  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatExternalSendHandler, setAiChatExternalSendHandler] = useState<((input?: string | any) => Promise<void>) | null>(null); // Updated type

  const [eventCoordinates, setEventCoordinates] = useState<Map<string, { lat: number; lng: number }>>(new Map());

  const chatLogic = useChatLogic();

  const mapRef = useRef<HTMLDivElement>(null);

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadCachedCoordinates();
  }, []);

  useEffect(() => {
    const fetchAllUserProfiles = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');

      if (error) {
        console.error('Error fetching all user profiles:', error);
        return;
      }
      setAllUserProfiles(data || []);
    };

    fetchAllUserProfiles();

    const usersSubscription = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('User profile change received!', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setAllUserProfiles(prevProfiles => {
              const existingIndex = prevProfiles.findIndex(p => p.id === payload.new.id);
              if (existingIndex > -1) {
                return prevProfiles.map((p, i) => i === existingIndex ? payload.new as UserProfile : p);
              } else {
                return [...prevProfiles, payload.new as UserProfile];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setAllUserProfiles(prevProfiles => prevProfiles.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const geocodeEventLocations = async () => {
      if (!events.length) return;

      console.log('[EventHeatmap] Starting geocoding for events...');
      
      const uniqueLocations = new Set<string>();
      const locationData: Array<{ location: string; city?: string }> = [];

      // Filter events by selected city BEFORE sending for geocoding
      const currentCityEvents = events.filter(event => {
        const eventCityLower = event.city ? event.city.toLowerCase() : null;
        const selectedCityLower = selectedCity.toLowerCase();
        if (selectedCityLower === 'bi' || selectedCityLower === 'bielefeld') {
          return !eventCityLower || eventCityLower === 'bielefeld' || eventCityLower === 'bi';
        }
        return eventCityLower === selectedCityLower;
      });

      currentCityEvents.forEach(event => {
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
        const coordinates = await geocodeMultipleLocations(locationData);
        
        const newEventCoordinates = new Map<string, { lat: number; lng: number }>();
        
        currentCityEvents.forEach(event => { // Use currentCityEvents here as well
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
        console.log(`[EventHeatmap] Geocoded ${newEventCoordinates.size} event locations for selected city.`);
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
        'kopenhagen': { lat: 55.6833, lng: 12.5833 },
        'köln': { lat: 50.935173, lng: 6.953101 },
        'munich': { lat: 48.1351, lng: 11.5820 },
        
        
      };
      return coords[cityObject.abbr.toLowerCase()] || { lat: 52.0302, lng: 8.5311 };
    }
    return { lat: 52.0302, lng: 8.5311 };
  };

  const selectedDateFilteredEvents = React.useMemo(() => {
    const cityDisplayName = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity;
    console.log(`Filtering events for ${selectedDateString} in ${cityDisplayName}...`);
    
    const filtered = events
      .filter(event => {
        const isSelectedDateEvent = event.date === selectedDateString;
        const hasLocationData = event.location || event.city;
        
        const eventCityLower = event.city ? event.city.toLowerCase() : null;
        const selectedCityLower = selectedCity.toLowerCase();

        let isRelevantCity = false;
        if (selectedCityLower === 'bi' || selectedCityLower === 'bielefeld') {
          isRelevantCity = !eventCityLower || eventCityLower === 'bielefeld' || eventCityLower === 'bi';
        } else {
          isRelevantCity = eventCityLower === selectedCityLower;
        }
                                       
        console.log(`Event: ${event.title}, Date: ${event.date}, Location: ${event.location}, City: ${event.city}, IsSelectedDate: ${isSelectedDateEvent}, HasLocation: ${hasLocationData}, IsRelevantCity: ${isRelevantCity}`);
        
        // Modified to show events even without geocoding working
        return isSelectedDateEvent && isRelevantCity;
      })
      .map(event => {
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

    console.log(`Found ${filtered.length} events for ${selectedDateString} in ${cityDisplayName} with coordinates`);
    return filtered;
  }, [events, selectedDateString, selectedCity, eventCoordinates]);

  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    selectedDateFilteredEvents.forEach(event => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: selectedDateFilteredEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
  }, [selectedDateFilteredEvents]);

  const filteredEvents = React.useMemo(() => {
    let filtered = selectedDateFilteredEvents;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    const selectedHour = timeRange[0];
    filtered = filtered.filter(event => event.eventHour >= selectedHour);
    
    // Sort events by likes in descending order
    filtered = filtered.sort((a, b) => {
      const likesA = (a.likes || 0) + (a.rsvp_yes || 0) + (a.rsvp_maybe || 0);
      const likesB = (b.likes || 0) + (b.rsvp_yes || 0) + (b.rsvp_maybe || 0);
      return likesB - likesA;
    });
    
    return filtered;
  }, [selectedDateFilteredEvents, selectedCategory, timeRange]);

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
      liked_by_users: event.liked_by_users || [],
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

  const handleJoinEventChat = async (eventId: string, eventTitle: string) => {
    try {
      const groupId = await eventChatService.joinEventChat(eventId, eventTitle);
      
      if (groupId) {
        toast({
          title: "Event Chat beigetreten",
          description: `Du bist dem Chat für "${eventTitle}" beigetreten`,
        });
      } else {
        toast({
          title: "Fehler",
          description: "Event Chat konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error joining event chat:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive"
      });
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

  const handleCheckInWithStatus = async () => {
    const username = currentUser || localStorage.getItem('community_chat_username') || 'Gast';
    const avatar = userProfile?.avatar || localStorage.getItem('community_chat_avatar') || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;
    
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

      if (username && username !== 'Gast') {
        const profileData = {
          username,
          avatar,
          last_online: new Date().toISOString(),
          current_live_location_lat: userCurrentLat,
          current_live_location_lng: userCurrentLng,
          current_status_message: liveStatusMessage,
          current_checkin_timestamp: new Date().toISOString(),
        };
        
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (existingProfile) {
          await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('username', username);
        } else {
          await supabase
            .from('user_profiles')
            .insert(profileData);
        }
        
        refetchProfile();
      }

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
        description: liveStatusMessage ? `Dein Status: "${liveStatusMessage}" wurde geteilt.` : "Dein Standort wurde persistent gespeichert.",
      });

    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({
        title: "Fehler",
        description: error.message || "Es gab ein Problem beim Einchecken.",
        variant: "destructive"
      });
    } finally {
      setLiveStatusMessage('');
      checkInToast.dismiss();
      setShowCentralAvatar(false);
    }
  };

  const goToAIChat = () => {
    setShowAIChat(true);
    chatLogic.handleExternalQuery("Hallo KI, welche Events gibt es heute?");
  };

  // Only one declaration for handleOpenEventForm
  const handleOpenEventForm = async (eventData: any) => {
    try {
      const cityObject = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase());
      const cityName = cityObject ? cityObject.name : selectedCity;
      
      const eventWithCity = { ...eventData, city: cityName };

      console.log('Adding new event to database only:', eventWithCity);
      await addUserEvent(eventWithCity);
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
      return;
    }

    // Always reinitialize the map to prevent layout issues when switching between pages
    if (map) {
      map.remove();
      setMap(null);
    }

    console.log('[EventHeatmap] Initializing map for city:', selectedCity);
    const initialCenter = getCityCenterCoordinates(selectedCity);

    const leafletMap = L.map(mapRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: 13,
      attributionControl: false,
      zoomControl: false,
      preferCanvas: false
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19,
      className: 'map-tiles'
    }).addTo(leafletMap);

    setMap(leafletMap);

    // Force map to invalidate size after a short delay
    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 100);

    return () => {
      // Cleanup function to properly remove the map when component unmounts
      if (map) {
        console.log('[EventHeatmap] Cleaning up map...');
        map.remove();
        setMap(null);
      }
    };
  }, [mapRef.current, selectedCity]); // Add selectedCity back to ensure proper reinitialization

  // Separate useEffect for handling city changes with smooth animation
  useEffect(() => {
    if (map && selectedCity) {
      console.log('[EventHeatmap] City changed to:', selectedCity);
      const newCenter = getCityCenterCoordinates(selectedCity);
      
      // Deutschland center coordinates for zoom out effect
      const germanyCenter = { lat: 51.1657, lng: 10.4515 }; 
      
      // Step 1: Zoom out to show all of Germany
      map.setView([germanyCenter.lat, germanyCenter.lng], 6, {
        animate: true,
        duration: 0.8
      });
      
      // Step 2: After zoom out, zoom into the new city
      setTimeout(() => {
        map.setView([newCenter.lat, newCenter.lng], 13, {
          animate: true,
          duration: 1.2
        });
      }, 900); // Wait for zoom out to complete
    }
  }, [map, selectedCity]);
  
  // Cleanup map when component unmounts
  useEffect(() => {
    return () => {
      if (map) {
        console.log('[EventHeatmap] Cleaning up map');
        map.remove();
        setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (currentTribeSpotMarkersRef.current) {
      currentTribeSpotMarkersRef.current.forEach(marker => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    }
    currentTribeSpotMarkersRef.current = [];

    if (!map || (selectedCity.toLowerCase() !== 'bi' && selectedCity.toLowerCase() !== 'bielefeld')) {
      setTribeSpotMarkers([]);
      return;
    }

    const newTribeSpotMarkers: L.Marker[] = [];

    tribeSpots.forEach(spot => {
      const iconHtml = `
        <div style="
          background: #000000;
          color: white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px solid #d4af37;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
        " 
        onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 16px rgba(212,175,55,0.4)';"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)';">
          <div style="
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            line-height: 1.1;
            word-break: break-word;
            max-width: 40px;
          ">
            ${spot.name}

      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-tribe-spot-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

      marker.on('click', async () => {
        const username = currentUser || localStorage.getItem('community_chat_username') || 'Gast';
        const avatar = userProfile?.avatar || localStorage.getItem('community_chat_avatar') || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;
        
        try {
          const profileData = {
            username,
            avatar,
            last_online: new Date().toISOString(),
            current_live_location_lat: spot.lat,
            current_live_location_lng: spot.lng,
            current_status_message: `📍 @ ${spot.name}`,
            current_checkin_timestamp: new Date().toISOString(),
          };
          
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('username', username)
            .maybeSingle();

          if (existingProfile) {
            await supabase
              .from('user_profiles')
              .update(profileData)
              .eq('username', username);
          } else {
            await supabase
              .from('user_profiles')
              .insert(profileData);
          }

          const usersAtSpot = allUserProfiles.filter(user => {
            const hasLiveLocation = user.current_live_location_lat !== null && user.current_live_location_lng !== null;
            if (!hasLiveLocation) return false;
            
            const distance = Math.sqrt(
              Math.pow(user.current_live_location_lat! - spot.lat, 2) + 
              Math.pow(user.current_live_location_lng! - spot.lng, 2)
            );
            return distance < 0.002;
          });

          const cityCommunityGroupId = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.abbr.toLowerCase() + '_ausgehen' || 'bi_ausgehen';
          await messageService.sendMessage(
            cityCommunityGroupId,
            username,
            `🏛️ ${username} ist jetzt am ${spot.name}!`,
            avatar
          );

          toast({
            title: `Check-in am ${spot.name}!`,
            description: "Du bist jetzt am Tribe Spot eingecheckt.",
          });

          refetchProfile();
        } catch (error: any) {
          console.error('Tribe spot check-in failed:', error);
          toast({
            title: "Fehler",
            description: "Check-in am Tribe Spot fehlgeschlagen.",
            variant: "destructive"
          });
        }
      });

      const usersAtSpot = allUserProfiles.filter(user => {
        const hasLiveLocation = user.current_live_location_lat !== null && user.current_live_location_lng !== null;
        if (!hasLiveLocation) return false;
        
        const distance = Math.sqrt(
          Math.pow(user.current_live_location_lat! - spot.lat, 2) + 
          Math.pow(user.current_live_location_lng! - spot.lng, 2)
        );
        return distance < 0.002;
      });

      const popupContent = `
        <div style="min-width: 200px; max-width: 280px; font-family: sans-serif;">
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 32px; margin-bottom: 8px;">🏛️</div>
            <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937; font-size: 18px;">${spot.name}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Tribe Spot • Einfach hier einchecken!</p>
          </div>
          
          <div style="
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            text-align: center;
            margin-bottom: 12px;
            font-weight: 500;
          ">
            Klick hier für Check-in!
          </div>

          ${usersAtSpot.length > 0 ? `
            <div style="margin-top: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #374151;">
                🔥 Wer ist hier? (${usersAtSpot.length})
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${usersAtSpot.map(user => `
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 10px;
                  ">
                    <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + getInitials(user.username)}"
                         style="width: 16px; height: 16px; border-radius: 50%; border: 1px solid #d1d5db;"/>
                    <span style="color: #374151; font-weight: 500;">${user.username}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      newTribeSpotMarkers.push(marker);
    });

    setTribeSpotMarkers(newTribeSpotMarkers);
    currentTribeSpotMarkersRef.current = newTribeSpotMarkers;

    return () => {
      newTribeSpotMarkers.forEach(marker => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, selectedCity, allUserProfiles, currentUser, userProfile, refetchProfile]);

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

    filteredEvents.forEach(event => {
      const coords = eventCoordinates.get(event.id);
      const lat = coords?.lat || event.lat;
      const lng = coords?.lng || event.lng;
      
      if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
        console.warn(`Invalid coordinates for event ${event.title}: Lat ${lat}, Lng ${lng}. Skipping marker.`);
        return;
      }

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

  useEffect(() => {
    if (!map) {
      userMarkers.forEach(marker => {
        try { map?.removeLayer(marker); } catch (e) {}
      });
      setUserMarkers([]);
      return;
    }

    const markersToRemove = [...userMarkers];
    markersToRemove.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    
    const newUserMarkers: L.Marker[] = [];
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    allUserProfiles.forEach(user => {
      const userCity = user.favorite_locations?.[0]?.toLowerCase() || 'bielefeld';
      const selectedCityName = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name?.toLowerCase() || selectedCity.toLowerCase();
      
      let isUserInCurrentCity = false;
      if (selectedCityName === 'bielefeld' || selectedCityName === 'bi') {
        isUserInCurrentCity = !userCity || userCity === 'bielefeld' || userCity === 'bi';
      } else {
        isUserInCurrentCity = userCity === selectedCityName;
      }

      if (!isUserInCurrentCity) return;

      const hasLiveLocation = user.current_live_location_lat !== null && user.current_live_location_lng !== null && user.current_live_location_lat !== undefined && user.current_live_location_lng !== undefined;
      const hasStatusMessage = user.current_status_message && user.current_status_message.trim() !== '';
      const isRecentCheckin = user.current_checkin_timestamp &&
                               (new Date().getTime() - new Date(user.current_checkin_timestamp).getTime() < TWO_HOURS_MS);
      
      if (hasLiveLocation && hasStatusMessage) {
        const lat = user.current_live_location_lat as number;
        const lng = user.current_live_location_lng as number;
        const statusMessage = user.current_status_message as string;

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
              ${statusMessage}
            </div>
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + getInitials(user.username)}"
                 alt="${user.username}"
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
              ${user.username}
            </div>
          </div>
        `;

        const userMarkerIcon = L.divIcon({
          html: userIconHtml,
          className: 'user-marker',
          iconSize: [60, 90],
          iconAnchor: [30, 90]
        });

        const marker = L.marker([lat, lng], { 
          icon: userMarkerIcon,
          draggable: user.username === currentUser
        });
        
        marker.on('click', () => {
          setSelectedUserForPrivateChat(user);
          setIsPrivateChatOpen(true);
        });

        if (user.username === currentUser) {
          marker.on('dragend', (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            console.log(`User ${user.username} moved to:`, position.lat, position.lng);
            
            updateUserPosition(user.username, position.lat, position.lng);
          });
        }

        newUserMarkers.push(marker);
        map.addLayer(marker);
      }
    });
    setUserMarkers(newUserMarkers);

    return () => {
      newUserMarkers.forEach(marker => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, allUserProfiles, currentUser, selectedCity]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    
    const selectedEvent = filteredEvents.find(event =>
      (event.id || `${event.title}-${event.date}-${event.time}`) === eventId
    );
    
    if (selectedEvent && selectedEvent.lat && selectedEvent.lng && map) {
      map.setView([selectedEvent.lat, selectedEvent.lng], 15);
    }
  };

  const handleEventLike = async (eventId: string) => {
    try {
      // Find the event in the filtered events
      const event = filteredEvents.find(e => 
        (e.id || `${e.title}-${e.date}-${e.time}`) === eventId
      );
      
      if (!event || !event.id) return;

      // Use the handleLikeEvent from useEvents hook (extracted above)
      await handleLikeEvent(event.id);

      
    } catch (error: any) {
      console.error('Error liking event:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive"
      });
    }
  };

  const togglePanelHeight = () => {
    if (panelHeight === 'collapsed') {
      setPanelHeight('partial');
      setIsPanelOpen(true);
    } else if (panelHeight === 'partial') {
      setPanelHeight('full');
    } else {
      setPanelHeight('collapsed');
      setIsPanelOpen(false);
    }
  };

  const closePanelCompletely = () => {
    setPanelHeight('collapsed');
    setIsPanelOpen(false);
    setShowPerfectDayPanel(false);
  };
  
  const handleAIChatSend = async (messageContent?: string) => {
    if ((messageContent && messageContent.trim()) || aiChatInput.trim()) {
      setShowAIChat(true);
      if (aiChatExternalSendHandler) {
        // Pass aiChatInput to the handler, which expects a string or any
        await aiChatExternalSendHandler(aiChatInput); 
      }
      setAiChatInput('');
    }
  };

  const handleOpenEventFormForModal = () => { // Renamed to clearly differentiate it from handleOpenEventForm
    setIsEventFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce text-red-500" />
          <h2 className="text-xl mb-2">Lade Events...</h2>
          <p className="text-gray-400">Heutige Events werden geladen...</p>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
  const selectedCategoryDisplay = selectedCategory === 'all' ? 'Alle' : selectedCategory;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Live Ticker Header */}
      <HeatmapHeader selectedCity={selectedCity} chatInputProps={{
        input: aiChatInput,
        setInput: setAiChatInput,
        handleSendMessage: handleAIChatSend,
        isTyping: chatLogic.isTyping,
        onKeyDown: chatLogic.handleKeyPress,
        onChange: chatLogic.handleInputChange,
        isHeartActive: chatLogic.isHeartActive,
        handleHeartClick: chatLogic.handleHeartClick,
        globalQueries: chatLogic.globalQueries,
        toggleRecentQueries: chatLogic.toggleRecentQueries,
        inputRef: chatLogic.inputRef,
        onAddEvent: handleOpenEventFormForModal, // Use the no-argument function here
        showAnimatedPrompts: !aiChatInput.trim(),
        activeChatModeValue: "ai"
      }} />


      {/* Button to toggle Filter Panel - moved up */}
      <div className="absolute top-36 left-4 z-[1001]">
        <Button
          variant="outline"
          size="icon"
          className="bg-black/95 text-white border-gray-700 hover:bg-gray-800"
          onClick={() => setShowFilterPanel(prev => !prev)}
          title={showFilterPanel ? "Filter ausblenden" : "Filter anzeigen"}
        >
          {showFilterPanel ? <FilterX className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
        </Button>
      </div>

      {/* Filter Panel (Conditional Rendering) */}
      {showFilterPanel && (
        <div className="absolute top-60 left-4 z-[1003] space-y-3 max-w-sm animate-fade-in">
          <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Events für {format(selectedDate, 'dd.MM.yyyy')} in {cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity}
            </h3>
            
            <div className="space-y-4">
              {/* Date Picker */}
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {format(selectedDate, 'dd.MM.yyyy')}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 z-[9999]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="pointer-events-auto bg-gray-800 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category Dropdown */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      {selectedCategoryDisplay} ({selectedCategoryData?.count || 0})
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 z-[9999]">
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                      >
                        {category.name === 'all' ? 'Alle' : category.name} ({category.count})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Time Slider */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>Zeit: ab {getTimeFromSlider(timeRange[0])} Uhr</span>
                </div>
                <Slider
                  value={timeRange}
                  onValueChange={setTimeRange}
                  max={23}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>23:00</span>
                </div>
              </div>


            </div>
          </Card>

          {/* Stats */}
          <Card className="p-3 bg-black/95 backdrop-blur-md border-gray-700 text-white text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                {filteredEvents.length} Events ab {getTimeFromSlider(timeRange[0])} Uhr
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                {filteredEvents.reduce((sum, event) => sum + event.attendees, 0)} Interessierte
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-red-500">❤️</span>
                {filteredEvents.reduce((sum, event) => sum + (event.likes || 0), 0)} Likes
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* "Find YOUR Tribe" Button (above event panels) */}
      <div className="absolute bottom-44 left-6 z-[1000]">
        <Button
          onClick={() => setIsTribeFinderOpen(true)}
          className="bg-black hover:bg-gray-900 text-red-500 w-24 h-12 rounded-full shadow-lg flex flex-col items-center justify-center p-0 text-xs font-bold border-2 border-red-500/30"
        >
          <Users className="w-4 h-4 mb-0.5" />
          Find Tribe
        </Button>
      </div>

      {/* "Ich bin hier" Button (above event panels) */}
      <div className="absolute bottom-44 right-6 z-[1000]">
        <Button
          onClick={() => setShowCentralAvatar(true)}
          className="bg-black hover:bg-gray-900 text-red-500 w-24 h-12 rounded-full shadow-lg flex flex-col items-center justify-center p-0 text-xs font-bold border-2 border-red-500/30"
        >
          <Plus className="w-4 h-4 mb-0.5" />
          Ich bin hier!
        </Button>
      </div>

      {/* Default Event Display - Show 3 Events directly above navbar */}
      {!showPerfectDayPanel && !showAIChat && filteredEvents.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000]">
          {/* Default Event Panel Display */}
          <div className="px-2 py-4">
            <ThreeEventDisplay
              panelData={panelData}
              onEventSelect={handleEventSelect}
              onLikeEvent={handleEventLike}
              onJoinEventChat={handleJoinEventChat}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full map-container"
        style={{
          height: 'calc(100vh - 80px)', // Subtract bottom navigation + padding
          minHeight: 'calc(100vh - 80px)',
          zIndex: 1,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: '80px', // Bottom navigation space
        }}
      />

      <style>{`
        .map-container {
          background-color: #ff3333 !important;
        }
        .map-container .leaflet-layer,
        .map-container .leaflet-tile-pane,
        .map-container .leaflet-tile {
          filter: sepia(100%) saturate(400%) hue-rotate(355deg) brightness(0.7) contrast(1.6) !important;
        }
        .map-container .leaflet-control-zoom-in,
        .map-container .leaflet-control-zoom-out {
          background-color: rgba(0,0,0,0.8) !important;
          color: #ff3333 !important;
          border: 1px solid #ff3333 !important;
        }
        .map-container .leaflet-control-zoom a:hover {
          background-color: #ff3333 !important;
          color: white !important;
        }
      `}</style>

      {/* Central Avatar Modal */}
      {showCentralAvatar && (
        <div className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-red-500 shadow-lg">
                <img 
                  src={centralAvatarImage || `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(centralAvatarUsername)}`}
                  alt={centralAvatarUsername}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{centralAvatarUsername}</h2>
              <p className="text-gray-600">Was machst du gerade? Setze deinen Status und verbinde dich mit anderen Tribes!</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center relative w-full">
                <Input
                  placeholder="Was machst du gerade? (z.B. Jetzt im Café Barcelona)"
                  value={liveStatusMessage}
                  onChange={(e) => setLiveStatusMessage(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-red-500 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-800 placeholder-gray-500 pr-12"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckInWithStatus();
                    }
                  }}
                />
                <button
                  onClick={handleCheckInWithStatus}
                  disabled={!liveStatusMessage.trim()}
                  className={cn(
                    "absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2 flex-shrink-0",
                    liveStatusMessage.trim()
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleCheckInWithStatus}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full py-3"
                  disabled={!liveStatusMessage.trim()}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check-in
                </Button>
                <Button
                  onClick={() => setShowCentralAvatar(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 rounded-full py-3"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Perfect Day Panel */}
      {showPerfectDayPanel && perfectDayMessage && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-black/95 backdrop-blur-md h-96">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Perfect Day</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={goToAIChat}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1"
              >
                Zum Chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPerfectDayPanel(false)}
                className="text-white hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="p-4 overflow-y-auto h-full">
            <div
              dangerouslySetInnerHTML={{ __html: perfectDayMessage }}
            />
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {showAIChat && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-black/95 backdrop-blur-md h-96">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-black-700">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-white-400" />
              <span className="text-white font-medium">AI Event Chat</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAIChat(false)}
              className="text-white hover:bg-black-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* AI Chat Content */}
          <div className="h-full overflow-hidden">
            <FullPageChatBot
              chatLogic={chatLogic}
              activeChatModeValue="ai"
              communityGroupId=""
              hideInput={true}
              externalInput={aiChatInput}
              setExternalInput={setAiChatInput}
              onExternalSendHandlerChange={setAiChatExternalSendHandler}
            />
          </div>
        </div>
      )}


      {/* Event Form Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="z-[1100] bg-black/95 backdrop-blur-md border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-500" />
              Community Event hinzufügen
            </DialogTitle>
          </DialogHeader>
          <EventForm
            onAddEvent={handleOpenEventForm} // Passed the correctly typed function
            onSuccess={() => setIsEventFormOpen(false)}
            onCancel={() => setIsEventFormOpen(false)}
            selectedDate={new Date()}
          />
        </DialogContent>
      </Dialog>

      {/* Private Chat Dialog */}
      <PrivateChat
        open={isPrivateChatOpen}
        onOpenChange={setIsPrivateChatOpen}
        currentUser={currentUser}
        otherUser={selectedUserForPrivateChat}
      />

      {/* Tribe Finder Dialog */}
      <TribeFinder
        open={isTribeFinderOpen}
        onOpenChange={setIsTribeFinderOpen}
      />
    </div>
  );
};

export default EventHeatmap;