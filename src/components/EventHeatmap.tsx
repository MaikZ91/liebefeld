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
import { MapPin, Calendar, Users, Clock, ChevronDown, ChevronUp, X, Sparkles, Plus, CheckCircle, MessageSquare } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input'; 
import { userService } from '@/services/userService'; // Import userService
import { UserProfile } from '@/types/chatTypes'; // Import UserProfile type
import { getInitials } from '@/utils/chatUIUtils'; // Import getInitials
import PrivateChat from '@/components/users/PrivateChat'; // Import PrivateChat

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png', // Corrected path for marker icon
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // Corrected path for shadow icon
});

const EventHeatmap: React.FC = () => {
  const { events, isLoading, refreshEvents } = useEvents();
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState([new Date().getHours()]); 
  const [map, setMap] = useState<L.Map | null>(null);
  const [eventMarkers, setEventMarkers] = useState<L.Marker[]>([]); // Renamed for clarity
  const [userMarkers, setUserMarkers] = useState<L.Marker[]>([]); // New state for user markers
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState<'collapsed' | 'partial' | 'full'>('collapsed');
  const [perfectDayMessage, setPerfectDayMessage] = useState<string | null>(null);
  const [isPerfectDayLoading, setIsPerfectDayLoading] = useState(false);
  const [showPerfectDayPanel, setShowPerfectDayPanel] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false); 
  const [checkInSearchTerm, setCheckInSearchTerm] = useState(''); 
  const [liveStatusMessage, setLiveStatusMessage] = useState(''); // New: For custom status message
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false); // New: State for private chat
  const [selectedUserForPrivateChat, setSelectedUserForPrivateChat] = useState<UserProfile | null>(null); // New: User for private chat

  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get today's date in JL-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Convert hour slider value to time string
  const getTimeFromSlider = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Convert time string to hour number
  const getHourFromTime = (timeString: string): number => {
    const [hour] = timeString.split(':');
    return parseInt(hour, 10);
  };

  // Enhanced coordinate mapping using real location data
  function getCoordinatesForLocation(location: string, isLng: boolean = false): number | null {
    if (!location) return null;
    
    const locationLower = location.toLowerCase();
    
    // Bielefeld center coordinates as default
    const bielefeldCenter = { lat: 52.0302, lng: 8.5311 };
    
    // Enhanced location mapping with real coordinates for Bielefeld
    const locationMap: { [key: string]: { lat: number; lng: number } } = {
      // Cultural venues
      'forum': { lat: 52.0210, lng: 8.5320 },
      'lokschuppen': { lat: 52.0195, lng: 8.5340 },
      'kunsthalle': { lat: 52.0175, lng: 8.5380 },
      'theater': { lat: 52.0185, lng: 8.5355 },
      'stadttheater': { lat: 52.0185, lng: 8.5355 },
      'stadthalle': { lat: 52.0220, lng: 8.5400 },
      'rudolf-oetker-halle': { lat: 52.0210, lng: 8.5330 },
      'stereo bielefeld': { lat: 52.0200, lng: 8.5350 },
      'stereo': { lat: 52.0200, lng: 8.5350 },
      'nr.z.p': { lat: 52.0190, lng: 8.5370 },
      'nrzp': { lat: 52.0190, lng: 8.5370 },
      
      // University area
      'universität': { lat: 52.0380, lng: 8.4950 },
      'uni': { lat: 52.0380, lng: 8.4950 },
      'campus': { lat: 52.0380, lng: 8.4950 },
      
      // City districts
      'altstadt': { lat: 52.0192, lng: 8.5370 },
      'zentrum': { lat: 52.0302, lng: 8.5311 },
      'innenstadt': { lat: 52.0302, lng: 8.5311 },
      'mitte': { lat: 52.0302, lng: 8.5311 },
      'schildesche': { lat: 52.0450, lng: 8.4800 },
      'brackwede': { lat: 52.0050, lng: 8.5800 },
      'sennestadt': { lat: 51.9800, lng: 8.6200 },
      'heepen': { lat: 52.0500, lng: 8.6000 },
      'stieghorst': { lat: 52.0100, lng: 8.6100 },
      
      // Parks and outdoor areas
      'stadtpark': { lat: 52.0250, lng: 8.5280 },
      'bürgerpark': { lat: 52.0180, lng: 8.5200 },
      'tierpark': { lat: 52.0400, lng: 8.5100 },
      'botanischer garten': { lat: 52.0350, lng: 8.4900 },
      
      // Shopping and commercial
      'loom': { lat: 52.0200, lng: 8.5350 },
      'hauptbahnhof': { lat: 52.0280, lng: 8.5320 },
      'bahnhof': { lat: 52.0280, lng: 8.5320 },
      
      // Sports venues
      'schücoarena': { lat: 52.0320, lng: 8.5150 },
      'alm': { lat: 52.0320, lng: 8.5150 },
      'arminia': { lat: 52.0320, lng: 8.5150 },
      
      // Default fallback
      'bielefeld': bielefeldCenter
    };

    // Find exact matches first
    for (const [key, coords] of Object.entries(locationMap)) {
      if (locationLower === key || locationLower.includes(key)) {
        console.log(`Found coordinates for location "${location}": ${coords.lat}, ${coords.lng}`);
        return isLng ? coords.lng : coords.lat;
      }
    }

    // If no match found, use Bielefeld center with small random offset
    const offset = (Math.random() - 0.5) * 0.005; // Smaller offset for better clustering
    const coord = isLng ? bielefeldCenter.lng + offset : bielefeldCenter.lat + offset;
    console.log(`Using default coordinates with offset for location "${location}": ${coord}`);
    return coord;
  }

  // Filter events for today, Bielefeld (using city column), and with valid coordinates
  const todaysBielefeldEvents = React.useMemo(() => {
    console.log(`Filtering events for today (${today}) in Bielefeld...`);
    
    const filtered = events
      .filter(event => {
        const isToday = event.date === today;
        const hasLocation = event.location || event.city;
        // Filter specifically for Bielefeld using the city column
        const isBielefeld = event.city && event.city.toLowerCase() === 'bielefeld';
        
        console.log(`Event: ${event.title}, Date: ${event.date}, Location: ${event.location}, City: ${event.city}, IsToday: ${isToday}, HasLocation: ${hasLocation}, IsBielefeld: ${isBielefeld}`);
        return isToday && hasLocation && isBielefeld;
      })
      .map(event => {
        const locationText = event.location || event.city || event.title;
        const lat = getCoordinatesForLocation(locationText);
        const lng = getCoordinatesForLocation(locationText, true);
        
        return {
          ...event,
          lat,
          lng,
          attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0),
          eventHour: getHourFromTime(event.time)
        };
      })
      .filter(event => event.lat !== null && event.lng !== null);

    console.log(`Found ${filtered.length} events for today in Bielefeld with valid coordinates`);
    return filtered;
  }, [events, today]);

  // Get categories with counts from today's events
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    todaysBielefeldEvents.forEach(event => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });
    
    return [
      { name: 'all', count: todaysBielefeldEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
  }, [todaysBielefeldEvents]);

  // Filter events based on selected category and time
  const filteredEvents = React.useMemo(() => {
    let filtered = todaysBielefeldEvents;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    // Filter by time - show events at or after the selected hour
    const selectedHour = timeRange[0];
    filtered = filtered.filter(event => event.eventHour >= selectedHour);
    
    return filtered;
  }, [todaysBielefeldEvents, selectedCategory, timeRange]);

  // Convert events to panel format
  const panelEvents: PanelEvent[] = React.useMemo(() => {
    return filteredEvents.map(event => ({
      id: event.id || `${event.title}-${event.date}-${event.time}`,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location || event.city || 'Bielefeld',
      category: event.category,
      description: event.description,
      image_url: event.image_url || `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop&q=80&auto=format`,
      link: event.link,
      likes: event.likes || 0,
      rsvp_yes: event.rsvp_yes,
      rsvp_maybe: event.rsvp_maybe
    }));
  }, [filteredEvents]);

  // Create panel data
  const panelData: PanelEventData = React.useMemo(() => {
    const selectedIndex = selectedEventId 
      ? panelEvents.findIndex(event => event.id === selectedEventId)
      : 0;
    
    return {
      events: panelEvents,
      currentIndex: selectedIndex >= 0 ? selectedIndex : 0
    };
  }, [panelEvents, selectedEventId]);

  // Generate Perfect Day message
  const generatePerfectDay = async () => {
    setIsPerfectDayLoading(true);
    try {
      // Get user profile data from localStorage
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
      
      toast({ // Corrected: Using main toast function
        title: "Perfect Day generiert!",
        description: "Deine personalisierte Tagesempfehlung ist bereit.",
        variant: "default"
      });
    } catch (error: any) { 
      console.error('Error generating Perfect Day:', error);
      toast({ // Corrected: Using main toast function
        title: "Fehler",
        description: "Perfect Day konnte nicht generiert werden: " + (error.message || "Unbekannter Fehler."), 
        variant: "destructive"
      });
    } finally {
      setIsPerfectDayLoading(false);
    }
  };

  // Handle "Ich bin hier" check-in with custom status message
  const handleCheckInWithStatus = async () => {
    if (!currentUser || currentUser === 'Gast') {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um dich einzuchecken und einen Status zu setzen.",
        variant: "destructive"
      });
      return;
    }

    setIsCheckInDialogOpen(false); 
    const checkInToastId = toast.loading("Check-in wird verarbeitet..."); // Corrected: toast.loading is a function

    try {
      // For now, location for status can be fixed to Bielefeld center or current selected city
      // In a real app, this would come from user's actual location or map click
      const userCurrentLat = getCoordinatesForLocation('Bielefeld') as number;
      const userCurrentLng = getCoordinatesForLocation('Bielefeld', true) as number;

      // 1. Update user's profile with live location and status message
      const updatedProfileData: Partial<UserProfile> = {
        last_online: new Date().toISOString(),
        // These fields assume schema changes have been made:
        current_live_location_lat: userCurrentLat,
        current_live_location_lng: userCurrentLng,
        current_status_message: liveStatusMessage,
        current_checkin_timestamp: new Date().toISOString(),
      };

      // If favorite_locations should also reflect the 'live' location for map display:
      // Note: This is a fallback if current_live_location fields are not used for map rendering
      const updatedFavoriteLocations = userProfile?.favorite_locations 
        ? [...userProfile.favorite_locations, 'Aktueller Standort'].filter((value, index, self) => self.indexOf(value) === index) 
        : ['Aktueller Standort'];

      await supabase.from('user_profiles')
        .update({ 
          ...updatedProfileData,
          favorite_locations: updatedFavoriteLocations // Still update favorite_locations for map display
        })
        .eq('username', currentUser);
      
      // 2. Send message to community chat (Ausgehen channel)
      const communityMessage = liveStatusMessage 
        ? `📍 ${currentUser} ist jetzt hier: "${liveStatusMessage}"`
        : `📍 ${currentUser} ist jetzt in der Nähe!`;
      
      const bielefeldAusgehenGroupId = 'bi_ausgehen'; 

      const messageResult = await messageService.sendMessage(
        bielefeldAusgehenGroupId,
        currentUser,
        communityMessage,
        localStorage.getItem('community_chat_avatar') || ''
      );

      if (!messageResult) {
        console.error('Error sending check-in message: Message not sent or ID not returned.');
        throw new Error('Could not post check-in message to chat.');
      }

      // Refresh user profile and map markers
      refetchProfile(); 
      // User markers will be re-rendered via the useEffect hook triggered by userProfile change

      toast.dismiss(checkInToastId); 
      toast({ 
        title: "Erfolgreich eingecheckt!",
        description: liveStatusMessage ? `Dein Status: "${liveStatusMessage}" wurde geteilt.` : "Dein Standort wurde geteilt.",
        variant: "success"
      });

    } catch (error: any) { 
      console.error('Check-in failed:', error);
      toast.dismiss(checkInToastId); 
      toast({ 
        title: "Check-in fehlgeschlagen",
        description: error.message || "Es gab ein Problem beim Einchecken.", 
        variant: "destructive"
      });
    } finally {
      setLiveStatusMessage(''); // Clear status message
    }
  };

  // Navigate to chat
  const goToChat = () => {
    window.location.href = '/chat';
  };

  // Handle adding new event
  const handleAddEvent = async (eventData: any) => {
    try {
      // Add event to Supabase
      const { data, error } = await supabase
        .from('community_events')
        .insert([{
          ...eventData,
          city: 'Bielefeld', // Default to Bielefeld for heatmap
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: "Event erfolgreich erstellt!",
        description: `${eventData.title} wurde hinzugefügt.`,
        variant: "default"
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

  // Function to render user markers
  const renderUserMarkers = (usersToDisplay: UserProfile[]) => {
    if (!map) return;

    // Clear existing user markers
    userMarkers.forEach(marker => {
      map.removeLayer(marker);
    });

    const newUserMarkers: L.Marker[] = [];
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    usersToDisplay.forEach(user => {
      // Filter for users with active check-in status (assuming schema changes)
      const hasLiveLocation = (user as any).current_live_location_lat && (user as any).current_live_location_lng;
      const hasStatusMessage = (user as any).current_status_message && (user as any).current_status_message.trim() !== '';
      const isRecentCheckin = (user as any).current_checkin_timestamp && 
                               (new Date().getTime() - new Date((user as any).current_checkin_timestamp).getTime() < THIRTY_MINUTES_MS);

      if (hasLiveLocation && hasStatusMessage && isRecentCheckin) {
        const lat = (user as any).current_live_location_lat;
        const lng = (user as any).current_live_location_lng;
        const statusMessage = (user as any).current_status_message;

        // Custom icon for user avatar with status bubble
        const userIconHtml = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: auto;
            min-width: 80px;
            max-width: 150px;
            cursor: pointer;
          ">
            <div style="
              background: #ef4444; /* Speech bubble background */
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
              top: 5px; /* Adjust to float above avatar */
            ">
              ${statusMessage}
            </div>
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + getInitials(user.username)}" 
                 alt="${user.username}"
                 style="
                   width: 50px;
                   height: 50px;
                   border-radius: 50%;
                   border: 3px solid white; /* White border as in screenshot */
                   box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                   background-color: white;
                   position: relative;
                   z-index: 10;
                 "/>
            <div style="
              color: #333; /* Darker text for username below avatar */
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
          iconSize: [60, 90], // Adjust size to accommodate bubble and name
          iconAnchor: [30, 90], // Anchor at the bottom center
        });

        const userMarker = L.marker([lat, lng], { icon: userMarkerIcon });
        
        userMarker.on('click', () => {
          setSelectedUserForPrivateChat(user);
          setIsPrivateChatOpen(true);
        });

        userMarker.addTo(map);
        newUserMarkers.push(userMarker);
      }
    });
    setUserMarkers(newUserMarkers);
  };


  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing Leaflet Map...');
    
    try {
      const leafletMap = L.map(mapRef.current, {
        center: [52.0302, 8.5311], // Bielefeld center
        zoom: 13,
        zoomControl: true,
        preferCanvas: false
      });
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      setMap(leafletMap);
      console.log('Map initialized successfully');

      // Cleanup function
      return () => {
        if (leafletMap) {
          leafletMap.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapRef.current]);

  // Update event markers when filtered events change
  useEffect(() => {
    if (!map) return;

    console.log('Updating event markers for', filteredEvents.length, 'events');

    // Clear existing event markers
    eventMarkers.forEach(marker => {
      map.removeLayer(marker);
    });

    // Create new markers for filtered events
    const newEventMarkers: L.Marker[] = [];

    filteredEvents.forEach(event => {
      if (!event.lat || !event.lng) return;
      
      try {
        const likes = event.likes || 0;
        const eventId = event.id || `${event.title}-${event.date}-${event.time}`;
        
        // Determine marker size based on likes
        let markerSize = 40; // Default size
        let fontSize = 12;
        if (likes >= 50) {
          markerSize = 60;
          fontSize = 18;
        } else if (likes >= 20) {
          markerSize = 50;
          fontSize = 15;
        } else if (likes >= 5) {
          markerSize = 45;
          fontSize = 13;
        }

        const displayNumber = likes > 0 ? likes : (event.rsvp_yes || 1); // Fallback to rsvp_yes if likes is 0

        // Create custom marker icon
        const iconHtml = `
          <div style="
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: ${markerSize}px;
            height: ${markerSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize}px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            ${displayNumber}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
          popupAnchor: [0, -markerSize / 2]
        });

        const marker = L.marker([event.lat, event.lng], { icon: customIcon });

        // Add click handler to open panel and select event
        marker.on('click', () => {
          setSelectedEventId(eventId);
          setIsPanelOpen(true);
          setPanelHeight('partial');
          setShowPerfectDayPanel(false);
        });

        // Create popup content with real location from database
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${event.title}</h3>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📍</span>
              <span>${event.location || 'Bielefeld'}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">🏙️</span>
              <span>${event.city || 'Bielefeld'}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">📅</span>
              <span>Heute</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">⏰</span>
              <span>${event.time}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280;">
              <span style="margin-right: 8px;">👥</span>
              <span>${event.rsvp_yes || 0} Zusagen, ${event.rsvp_maybe || 0} Vielleicht</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280;">
              <span style="margin-right: 8px;">❤️</span>
              <span>${event.likes || 0} Likes</span>
            </div>
            ${event.description ? `<p style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">${event.description}</p>` : ''}
            <div style="
              background: #ef4444;
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              display: inline-block;
            ">
              ${event.category}
            </div>
            ${event.link ? `<div style="margin-top: 8px;"><a href="${event.link}" target="_blank" style="color: #ef4444; text-decoration: underline;">Mehr Info</a></div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        newEventMarkers.push(marker);
      } catch (error) {
        console.error('Error creating marker for event:', event.title, error);
      }
    });

    setEventMarkers(newEventMarkers);
  }, [map, filteredEvents]);

  // New useEffect to fetch and display user markers
  useEffect(() => {
    if (!map) return;

    const fetchAndDisplayUsers = async () => {
      console.log('Fetching and displaying user markers...');
      const allUsers = await userService.getUsers();

      renderUserMarkers(allUsers);
    };

    // Call this function when map is ready and whenever user data or locations might change
    if (map) {
      fetchAndDisplayUsers();
    }

    // Optionally, set up a refresh for user locations/status if needed (e.g., every minute)
    const userRefreshInterval = setInterval(fetchAndDisplayUsers, 60 * 1000); // Refresh every 1 minute
    return () => clearInterval(userRefreshInterval);

  }, [map, events, userProfile]); // Re-run when userProfile or events change

  // Handle event selection from panel
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    
    // Find the event and zoom to its location
    const selectedEvent = filteredEvents.find(event => 
      (event.id || `${event.title}-${event.date}-${event.time}`) === eventId
    );
    
    if (selectedEvent && selectedEvent.lat && selectedEvent.lng && map) {
      map.setView([selectedEvent.lat, selectedEvent.lng], 15);
    }
  };

  // Handle panel height changes
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

  const filteredCheckInEvents = todaysBielefeldEvents.filter(event => 
    event.title.toLowerCase().includes(checkInSearchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(checkInSearchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(checkInSearchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-sm">
        <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Events heute in Bielefeld
          </h3>
          
          <div className="space-y-4">
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
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
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

            {/* Perfect Day Button */}
            <Button
              onClick={generatePerfectDay}
              disabled={isPerfectDayLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isPerfectDayLoading ? 'Generiere...' : 'Perfect Day'}
            </Button>
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

      {/* Panel Toggle Button */}
      {!isPanelOpen && !showPerfectDayPanel && filteredEvents.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <Button
            onClick={() => {
              setIsPanelOpen(true);
              setPanelHeight('partial');
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg"
          >
            <ChevronUp className="w-5 h-5 mr-2" />
            {filteredEvents.length} Events anzeigen
          </Button>
        </div>
      )}

      {/* "Ich bin hier" Button (bottom right, floating) */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <Button
          onClick={() => setIsCheckInDialogOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white w-28 h-16 rounded-full shadow-lg flex flex-col items-center justify-center p-0 text-sm font-bold"
        >
          <Plus className="w-6 h-6 mb-0.5" />
          Ich bin hier!
        </Button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ 
          minHeight: '100vh',
          zIndex: 1
        }}
      />

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
                onClick={goToChat}
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
              className="text-white prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: perfectDayMessage }}
            />
          </div>
        </div>
      )}

      {/* Swipeable Event Panel */}
      {isPanelOpen && panelEvents.length > 0 && !showPerfectDayPanel && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-[1000] bg-black/95 backdrop-blur-md transition-all duration-300 ease-in-out",
          {
            'h-32': panelHeight === 'collapsed',
            'h-96': panelHeight === 'partial',
            'h-full': panelHeight === 'full'
          }
        )}>
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-1 bg-gray-500 rounded-full cursor-pointer"
                onClick={togglePanelHeight}
              />
              <span className="text-white font-medium">
                {panelEvents.length} Events
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePanelHeight}
                className="text-white hover:bg-gray-700"
              >
                {panelHeight === 'full' ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePanelCompletely}
                className="text-white hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="p-4 overflow-hidden">
            <SwipeableEventPanel
              panelData={panelData}
              onEventSelect={handleEventSelect}
              className="w-full max-w-md mx-auto"
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
            onAddEvent={handleAddEvent}
            onSuccess={() => setIsEventFormOpen(false)}
            onCancel={() => setIsEventFormOpen(false)}
            selectedDate={new Date()}
          />
        </DialogContent>
      </Dialog>

      {/* Live Check-in Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="z-[1100] bg-black/95 backdrop-blur-md border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Ich bin hier!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-300">Setze deinen Status:</p>
            <Input
              placeholder="Was machst du gerade? (z.B. Jetzt im Café Barcelona)"
              value={liveStatusMessage}
              onChange={(e) => setLiveStatusMessage(e.target.value)}
              className="bg-gray-800 border-gray-700 focus:ring-green-500 focus:border-green-500 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleCheckInWithStatus}
              disabled={!liveStatusMessage.trim()}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle className="w-5 h-5 mr-2" /> Status teilen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Private Chat Dialog */}
      <PrivateChat
        open={isPrivateChatOpen}
        onOpenChange={setIsPrivateChatOpen}
        currentUser={currentUser}
        otherUser={selectedUserForPrivateChat}
      />
    </div>
  );
};

export default EventHeatmap;