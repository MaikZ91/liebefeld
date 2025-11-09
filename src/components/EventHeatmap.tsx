// EventHeatmap.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Plus,
  CheckCircle,
  Send,
  Filter,
  FilterX,
  MessageSquare,
  CalendarIcon,
  Heart,
} from "lucide-react";
import SuggestionChips from "@/components/event-chat/SuggestionChips";
import { useEvents } from "@/hooks/useEvents";

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ThreeEventDisplay from "@/components/event-chat/ThreeEventDisplay";
import { PanelEventData, PanelEvent } from "@/components/event-chat/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import EventForm from "@/components/EventForm";
import FilterBar, { FilterGroup } from "@/components/calendar/FilterBar";
import { getCategoryGroup, CategoryGroup } from "@/utils/eventCategoryGroups";
import { useUserProfile } from "@/hooks/chat/useUserProfile";
import { getSelectedCategory, saveSelectedCategory } from "@/utils/heatmapPreferences";
import { messageService } from "@/services/messageService";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserProfile, USERNAME_KEY } from "@/types/chatTypes";
import { getInitials } from "@/utils/chatUIUtils";
import PrivateChat from "@/components/users/PrivateChat";
import HeatmapHeader from "./HeatmapHeader";
import { useEventContext, cities } from "@/contexts/EventContext";
import { useChatLogic } from "@/components/event-chat/useChatLogic";
import { geocodeLocation, loadCachedCoordinates, geocodeMultipleLocations } from "@/services/geocodingService";
import TribeFinder from "./TribeFinder";
import { eventChatService } from "@/services/eventChatService";
import EventChatWindow from "@/components/event-chat/EventChatWindow";
import EventSwipeMode from "./EventSwipeMode";
import EventDetails from "@/components/EventDetails";
import { dislikeService } from "@/services/dislikeService";
import OnboardingDialog from "./OnboardingDialog";
import { useOnboardingLogic } from "@/hooks/chat/useOnboardingLogic";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Define tribeSpots outside the component to ensure it's a constant and accessible
const tribeSpots = [
  { name: "Sparrenburg", lat: 52.0149, lng: 8.52678 },
  { name: "Obersee", lat: 52.056974, lng: 8.563763 },
  { name: "Lutterviertel", lat: 52.017241, lng: 8.538027 },
  { name: "Gellershagen Park", lat: 52.05, lng: 8.5167 },
  { name: "Klosterplatz", lat: 52.0208, lng: 8.5286 },
  { name: "Nordpark", lat: 52.0368, lng: 8.529 },
  { name: "Universität Bielefeld", lat: 52.0378, lng: 8.4931 },
  { name: "Schwedenschanze", lat: 52.06854, lng: 8.36961 },
];

const EventHeatmap: React.FC = () => {
  const { selectedCity } = useEventContext();
  const { events, isLoading, refreshEvents, addUserEvent, handleLikeEvent } = useEvents(selectedCity);
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<FilterGroup>(() => getSelectedCategory() as FilterGroup);
  const [timeRange, setTimeRange] = useState([new Date().getHours()]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [map, setMap] = useState<L.Map | null>(null);
  const [eventMarkers, setEventMarkers] = useState<L.Marker[]>([]);
  const [tribeSpotMarkers, setTribeSpotMarkers] = useState<L.Marker[]>([]);
  const currentTribeSpotMarkersRef = useRef<L.Marker[]>();
  const [userMarkers, setUserMarkers] = useState<L.Marker[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState<"collapsed" | "partial" | "full">("collapsed");
  const [perfectDayMessage, setPerfectDayMessage] = useState<string | null>(null);
  const [isPerfectDayLoading, setIsPerfectDayLoading] = useState(false);
  const [showPerfectDayPanel, setShowPerfectDayPanel] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [liveStatusMessage, setLiveStatusMessage] = useState("");
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [selectedUserForPrivateChat, setSelectedUserForPrivateChat] = useState<UserProfile | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [isTribeFinderOpen, setIsTribeFinderOpen] = useState(false);
  const [selectedTribeSpot, setSelectedTribeSpot] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [isTribeSpotDialogOpen, setIsTribeSpotDialogOpen] = useState(false);
  const [isSwipeModeOpen, setIsSwipeModeOpen] = useState(false);

  // Declare central avatar states at the top level to ensure scope
  const [centralAvatarUsername, setCentralAvatarUsername] = useState("");
  const [centralAvatarImage, setCentralAvatarImage] = useState("");
  const [showCentralAvatar, setShowCentralAvatar] = useState(false);

  // Handle category change with persistence
  const handleCategoryChange = (category: FilterGroup) => {
    setSelectedCategory(category);
    saveSelectedCategory(category);
  };

  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatExternalSendHandler, setAiChatExternalSendHandler] = useState<
    ((input?: string | any) => Promise<void>) | null
  >(null); // Updated type

  const [eventCoordinates, setEventCoordinates] = useState<Map<string, { lat: number; lng: number }>>(new Map());

  // NEW STATE FOR PANELS VISIBILITY
  const [showEventPanels, setShowEventPanels] = useState(true);

  // State for disliked events
  const [dislikedEventIds, setDislikedEventIds] = useState<string[]>([]);

  // State for location blocking dialog
  const [isBlockLocationDialogOpen, setIsBlockLocationDialogOpen] = useState(false);
  const [locationToBlock, setLocationToBlock] = useState<string | null>(null);

  // State for MIA open/close
  const [isMIAOpen, setIsMIAOpen] = useState(false);

  // State for onboarding mode
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  // State for daily recommendation
  const [hasNewDailyRecommendation, setHasNewDailyRecommendation] = useState(false);
  const [isDailyRecommendationLoading, setIsDailyRecommendationLoading] = useState(false);

  // State for AI chat loading
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);

  // Detail view state for event details dialog
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);

  // Event Chat Window State
  const [eventChatWindow, setEventChatWindow] = useState<{
    eventId: string;
    eventTitle: string;
    isOpen: boolean;
  } | null>(null);

  // AI Response State for Heatmap
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [currentAiEventContext, setCurrentAiEventContext] = useState<{ id: string; title: string } | null>(null);

  // ====== NEW: make anchors render as inline chips in AI HTML ======
  const enhanceLinksToChips = (html: string) => {
    if (!html) return html;
    return html.replace(/<a\s/gi, '<a class="ai-chip" ');
  };

  // Callback to update heatmap date filter from AI chat
  const handleDateFilterFromChat = useCallback((date: Date) => {
    setSelectedDate(date);
    toast.success(`Karte aktualisiert auf ${format(date, "dd.MM.yyyy")}`);
  }, []);

  // Callback to update heatmap category filter from AI chat
  const handleCategoryFilterFromChat = useCallback((category: string) => {
    handleCategoryChange(category as FilterGroup);
    toast.success(`Kategorie-Filter aktualisiert auf ${category}`);
  }, []);

  // Callback to receive AI response directly in heatmap (with chipified links)
  const handleAiResponseReceived = useCallback((response: string, suggestions?: string[]) => {
    setAiResponse(enhanceLinksToChips(response));
    setAiSuggestions(suggestions || []);
    setShowAiResponse(true);
    setIsAiChatLoading(false);
  }, []);

  const chatLogic = useChatLogic(
    false,
    "ai",
    handleDateFilterFromChat,
    handleCategoryFilterFromChat,
    handleAiResponseReceived,
  );

  // Onboarding logic
  const onboardingLogic = useOnboardingLogic(
    (action) => {
      // Handle onboarding completion
      setIsOnboardingActive(false);
      setIsMIAOpen(false);
      toast({
        title: "Onboarding abgeschlossen!",
        description: "Viel Spaß beim Entdecken von Events!",
      });
    },
    // Pass setSelectedCity from EventContext if available
    undefined
  );

  // ====== helper to render + fetch description via Edge Function ======
  const renderEventHtml = (evt: any, description: string) => {
    const safeDesc = description || "Keine Beschreibung gefunden.";
    const eid = evt.id || `${evt.title}-${evt.date}-${evt.time}`;
    const cat = evt.category || "Events";
    return `
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <img src="${evt.image_url || ""}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.12)" onerror="this.style.display='none'"/>
          <div>
            <div class="text-white font-semibold">${evt.title}</div>
            <div class="text-white/60 text-xs">${evt.date} • ${evt.time}${evt.location ? " • " + evt.location : ""}</div>
          </div>
        </div>
        <div class="text-white/90 text-sm leading-5">${safeDesc}</div>
        <div class="flex flex-wrap gap-2 pt-2">
          <a href="event://attend/${eid}" class="ai-chip">🎉 Ich bin dabei</a>
          <a href="event://${eid}" class="ai-chip">Auf Karte zeigen</a>
          <a href="event://similar?cat=${encodeURIComponent(cat)}" class="ai-chip">Ähnliche Events</a>
          <a href="event://save/${eid}" class="ai-chip">Speichern ⭐</a>
        </div>
      </div>
    `;
  };

  const fetchAndShowEventDescription = async (evt: any) => {
    if (!evt) return;
    try {
      setIsMIAOpen(true);
      setIsAiChatLoading(true);
      setShowAiResponse(false);

      const { data, error } = await supabase.functions.invoke("fetch-event-description", {
        body: {
          eventLink: evt.link ?? null,
          eventData: {
            title: evt.title,
            category: evt.category,
            location: evt.location,
            organizer: (evt as any).organizer ?? null,
            date: evt.date,
            time: evt.time,
            city: evt.city ?? selectedCity,
          },
        },
      });
      if (error) throw error;

      const desc = (data as any)?.description || (data as any)?.response || "";
      const html = renderEventHtml(evt, desc);
      setCurrentAiEventContext({ id: (evt.id || `${evt.title}-${evt.date}-${evt.time}`), title: evt.title });
      handleAiResponseReceived(html, ["🎉 Ich bin dabei", "Treffen vorschlagen", "Weitere Events heute", "Events am Wochenende"]);
    } catch (e) {
      toast.error("Konnte Eventbeschreibung nicht laden");
      const html = renderEventHtml(evt, "Keine Beschreibung verfügbar. Versuche es später erneut.");
      handleAiResponseReceived(html, ["Was läuft heute?", "Events am Wochenende"]);
    } finally {
      setIsAiChatLoading(false);
    }
  };
  // ====== /helpers ======

  // Registriere Event-Link-Handler global
  useEffect(() => {
    (window as any).handleEventLinkClick = async (eventId: string) => {
      console.log("[EventHeatmap] handleEventLinkClick -> inline in MIA", eventId);
      // Inline in MIA anzeigen
      setShowEventDetails(false);
      setIsMIAOpen(true);
      setShowAiResponse(false);

      // Nutze unsere neue Edge-Function
      const evt = filteredEvents.find((e) => (e.id || `${e.title}-${e.date}-${e.time}`) === eventId);
      if (!evt) {
        console.warn("[EventHeatmap] Event not found for id:", eventId);
        toast.error("Event nicht gefunden");
        return;
      }
      await fetchAndShowEventDescription(evt);
    };

    // Register additional handlers for event detail buttons (legacy)
    (window as any).showEventOnMap = (eventId: string) => {
      console.log("Show event on map:", eventId);
      setShowAIChat(false);
      setShowAiResponse(false);
      toast.info("Karten-Funktion wird demnächst verfügbar sein");
    };

    (window as any).showSimilarEvents = (category: string) => {
      console.log("Show similar events for category:", category);
      if (aiChatExternalSendHandler) {
        setShowAiResponse(false);
        aiChatExternalSendHandler(`Zeige mir ${category} Events`);
      }
    };

    (window as any).saveEvent = (eventId: string) => {
      console.log("Save event:", eventId);
      toast.success("Event wurde zu deinen Favoriten hinzugefügt! ⭐");
      // TODO: Implement save to favorites logic
    };

    return () => {
      delete (window as any).handleEventLinkClick;
      delete (window as any).showEventOnMap;
      delete (window as any).showSimilarEvents;
      delete (window as any).saveEvent;
    };
  }, [events, aiChatExternalSendHandler]); // filteredEvents is derived from state; events dep is OK here

  // Global capture listener for event:// links (works also in MIA response card)
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = (target.closest && target.closest("a")) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("event://")) return;
      e.preventDefault();

      // Optional routes for chips:
      if (href.startsWith("event://similar?")) {
        const params = new URLSearchParams(href.split("?")[1] || "");
        const cat = params.get("cat") || "";
        (window as any).showSimilarEvents?.(cat);
        return;
      }
      if (href.startsWith("event://save/")) {
        const eventId = href.replace("event://save/", "");
        (window as any).saveEvent?.(eventId);
        return;
      }
      if (href.startsWith("event://attend/")) {
        const eventId = href.replace("event://attend/", "");
        (window as any).handleAttendEvent?.(eventId);
        return;
      }

      const eventId = href.slice("event://".length);
      (window as any).handleEventLinkClick?.(eventId);
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("touchend", handler as EventListener, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("touchend", handler as EventListener, true);
    };
  }, [aiChatExternalSendHandler]);

  // Fallback: ensure send handler is available immediately
  useEffect(() => {
    if (!aiChatExternalSendHandler) {
      try {
        setAiChatExternalSendHandler(() => (chatLogic as any)?.handleSendMessage);
      } catch (e) {
        console.warn("[EventHeatmap] Could not set fallback send handler:", e);
      }
    }
  }, [chatLogic, aiChatExternalSendHandler]);

  const mapRef = useRef<HTMLDivElement>(null);

  // Auto-start onboarding if user is not logged in
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(USERNAME_KEY);
    
    if (!hasCompletedOnboarding) {
      // Automatically start onboarding for new users
      setIsOnboardingActive(true);
      setIsMIAOpen(true);
      setShowAiResponse(true);
    }
  }, []);

  // Check for daily recommendation on mount
  useEffect(() => {
    const checkDailyRecommendation = () => {
      const today = new Date().toISOString().split("T")[0];
      const lastShownDate = localStorage.getItem("last_daily_recommendation_date");

      if (lastShownDate !== today) {
        setHasNewDailyRecommendation(true);
      }
    };

    checkDailyRecommendation();

    // Setup global function for "Personalisiere deine Perfect Day Nachricht" button
    (window as any).openProfileEditor = () => {
      setShowAIChat(false);
      toast.info("Öffne dein Profil unter dem Benutzer-Icon, um deine Interessen anzupassen");
    };

    return () => {
      delete (window as any).openProfileEditor;
    };
  }, []);

  // Load daily recommendation when MIA is clicked
  const handleMIAClick = async () => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(USERNAME_KEY);
    
    if (!hasCompletedOnboarding) {
      // Start onboarding
      setIsOnboardingActive(true);
      setIsMIAOpen(true);
      setShowAiResponse(true);
      return;
    }
    
    if (hasNewDailyRecommendation) {
      setIsDailyRecommendationLoading(true);

      try {
        // Call the perfect day edge function
        const { data, error } = await supabase.functions.invoke("generate-perfect-day", {
          body: {
            username: currentUser || "Gast",
            weather: "partly_cloudy",
            interests: userProfile?.interests || [],
            favorite_locations: userProfile?.favorite_locations || [],
          },
        });

        if (error) throw error;

        if (data?.response) {
          // Show the response in the AI response card
          const suggestions = ["Weitere Events heute", "Events am Wochenende", "Kreative Events", "Sport Events"];
          handleAiResponseReceived(data.response, suggestions);

          // Mark as shown for today
          const today = new Date().toISOString().split("T")[0];
          localStorage.setItem("last_daily_recommendation_date", today);
          setHasNewDailyRecommendation(false);

          toast.success("Hier ist deine Tagesempfehlung!");
        }
      } catch (error) {
        console.error("Error loading daily recommendation:", error);
        toast.error("Konnte Tagesempfehlung nicht laden");
      } finally {
        setIsDailyRecommendationLoading(false);
      }
    }
  };

  const selectedDateString = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    loadCachedCoordinates();
  }, []);

  // Load disliked events from localStorage on mount
  useEffect(() => {
    const loadDislikedEvents = async () => {
      try {
        const dislikedIds = await dislikeService.getDislikedEvents();
        console.log("[EventHeatmap] Loaded disliked events from localStorage:", dislikedIds);
        setDislikedEventIds(dislikedIds);
      } catch (error) {
        console.error("Error loading disliked events:", error);
      }
    };

    loadDislikedEvents();
  }, []);

  useEffect(() => {
    const fetchAllUserProfiles = async () => {
      const { data, error } = await supabase.from("user_profiles").select("*");

      if (error) {
        console.error("Error fetching all user profiles:", error);
        return;
      }
      setAllUserProfiles(data || []);
    };

    fetchAllUserProfiles();

    const usersSubscription = supabase
      .channel("user_profiles_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_profiles" }, (payload) => {
        console.log("User profile change received!", payload);
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          setAllUserProfiles((prevProfiles) => {
            const existingIndex = prevProfiles.findIndex((p) => p.id === payload.new.id);
            if (existingIndex > -1) {
              return prevProfiles.map((p, i) => (i === existingIndex ? (payload.new as UserProfile) : p));
            } else {
              return [...prevProfiles, payload.new as UserProfile];
            }
          });
        } else if (payload.eventType === "DELETE") {
          setAllUserProfiles((prevProfiles) => prevProfiles.filter((p) => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const geocodeEventLocations = async () => {
      if (!events.length) return;

      console.log("[EventHeatmap] Starting geocoding for events...]");

      const uniqueLocations = new Set<string>();
      const locationData: Array<{ location: string; city?: string }> = [];

      // Filter events by selected city BEFORE sending for geocoding
      const currentCityEvents = events.filter((event) => {
        const eventCityLower = event.city ? event.city.toLowerCase() : null;
        const selectedCityLower = selectedCity.toLowerCase();
        if (selectedCityLower === "bi" || selectedCityLower === "bielefeld") {
          return !eventCityLower || eventCityLower === "bielefeld" || eventCityLower === "bi";
        }
        return eventCityLower === selectedCityLower;
      });

      currentCityEvents.forEach((event) => {
        if (event.location && !uniqueLocations.has(event.location)) {
          uniqueLocations.add(event.location);
          locationData.push({
            location: event.location,
            city: event.city || selectedCity,
          });
        }
      });

      if (locationData.length === 0) return;

      try {
        const coordinates = await geocodeMultipleLocations(locationData);

        const newEventCoordinates = new Map<string, { lat: number; lng: number }>();

        currentCityEvents.forEach((event) => {
          if (event.location) {
            const key = `${event.location}_${event.city || selectedCity}`;
            const coords = coordinates.get(key);
            if (coords) {
              newEventCoordinates.set(event.id, {
                lat: coords.lat,
                lng: coords.lng,
              });
            }
          }
        });

        setEventCoordinates(newEventCoordinates);
        console.log(`[EventHeatmap] Geocoded ${newEventCoordinates.size} event locations for selected city.`);
      } catch (error) {
        console.error("[EventHeatmap] Error during batch geocoding:", error);
      }
    };

    geocodeEventLocations();
  }, [events, selectedCity]);

  const getTimeFromSlider = (hour: number): string => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  const getHourFromTime = (timeString: string): number => {
    const [hour] = timeString.split(":");
    return parseInt(hour, 10);
  };

  const getCityCenterCoordinates = (cityAbbr: string) => {
    const cityObject = cities.find((c) => c.abbr.toLowerCase() === cityAbbr.toLowerCase());
    if (cityObject) {
      const coords: { [key: string]: { lat: number; lng: number } } = {
        bi: { lat: 52.0302, lng: 8.5311 },
        bielefeld: { lat: 52.0302, lng: 8.5311 },
        berlin: { lat: 52.52, lng: 13.405 },
        hamburg: { lat: 53.5511, lng: 9.9937 },
        kopenhagen: { lat: 55.6833, lng: 12.5833 },
        köln: { lat: 50.935173, lng: 6.953101 },
        munich: { lat: 48.1351, lng: 11.582 },
      };
      return coords[cityObject.abbr.toLowerCase()] || { lat: 52.0302, lng: 8.5311 };
    }
    return { lat: 52.0302, lng: 8.5311 };
  };

  const selectedDateFilteredEvents = React.useMemo(() => {
    const cityDisplayName =
      cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity;
    console.log(`Filtering events for ${selectedDateString} in ${cityDisplayName}...`);

    const filtered = events
      .filter((event) => {
        const isSelectedDateEvent = event.date === selectedDateString;

        const eventCityLower = event.city ? event.city.toLowerCase() : null;
        const selectedCityLower = selectedCity.toLowerCase();

        let isRelevantCity = false;
        if (selectedCityLower === "bi" || selectedCityLower === "bielefeld") {
          isRelevantCity = !eventCityLower || eventCityLower === "bielefeld" || eventCityLower === "bi";
        } else {
          isRelevantCity = eventCityLower === selectedCityLower;
        }

        return isSelectedDateEvent && isRelevantCity;
      })
      .map((event) => {
        const coords = eventCoordinates.get(event.id);
        const lat = coords?.lat || getCityCenterCoordinates(selectedCity).lat;
        const lng = coords?.lng || getCityCenterCoordinates(selectedCity).lng;

        return {
          ...event,
          lat,
          lng,
          attendees: (event.rsvp_yes || 0) + (event.rsvp_maybe || 0) + (event.likes || 0),
          eventHour: getHourFromTime(event.time),
        };
      });

    console.log(`Found ${filtered.length} events for ${selectedDateString} in ${cityDisplayName} with coordinates`);
    return filtered;
  }, [events, selectedDateString, selectedCity, eventCoordinates]);

  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    selectedDateFilteredEvents.forEach((event) => {
      categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
    });

    return [
      { name: "all", count: selectedDateFilteredEvents.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })),
    ];
  }, [selectedDateFilteredEvents]);

  const filteredEvents = React.useMemo(() => {
    let filtered = selectedDateFilteredEvents;

    // Filter out blocked locations
    const blockedLocations = dislikeService.getBlockedLocations();
    filtered = filtered.filter((event) => {
      if (event.location && blockedLocations.includes(event.location)) {
        return false;
      }
      return true;
    });

    // Filter out disliked events
    filtered = filtered.filter((event) => {
      const eventId = event.id || `${event.title}-${event.date}-${event.time}`;
      return !dislikedEventIds.includes(eventId);
    });

    if (selectedCategory !== "alle") {
      if (selectedCategory === "ausgehen") {
        filtered = filtered.filter((event) => {
          const eventCategoryGroup = getCategoryGroup(event.category);
          return eventCategoryGroup !== "Sport";
        });
      } else {
        const categoryGroupMap: Record<FilterGroup, CategoryGroup | null> = {
          alle: null,
          ausgehen: "Ausgehen",
          sport: "Sport",
          kreativität: "Kreativität",
        };

        const targetCategoryGroup = categoryGroupMap[selectedCategory];
        if (targetCategoryGroup) {
          filtered = filtered.filter((event) => {
            const eventCategoryGroup = getCategoryGroup(event.category);
            return eventCategoryGroup === targetCategoryGroup;
          });
        }
      }
    }

    const selectedHour = timeRange[0];
    filtered = filtered.filter((event) => event.eventHour >= selectedHour);

    filtered = filtered.sort((a, b) => {
      const likesA = (a.likes || 0) + (a.rsvp_yes || 0) + (a.rsvp_maybe || 0);
      const likesB = (b.likes || 0) + (b.rsvp_yes || 0) + (b.rsvp_maybe || 0);
      return likesB - likesA;
    });

    return filtered;
  }, [selectedDateFilteredEvents, selectedCategory, timeRange, dislikedEventIds]);

  const panelEvents: PanelEvent[] = React.useMemo(() => {
    return filteredEvents.map((event) => ({
      id: event.id || `${event.title}-${event.date}-${event.time}`,
      title: event.title,
      date: event.date,
      time: event.time,
      price: event.is_paid ? "Kostenpflichtig" : "Kostenlos",
      location: event.location || event.city || "Unknown Location",
      image_url:
        event.image_url ||
        `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop&q=80&auto=format`,
      category: event.category,
      link: event.link,
      likes: event.likes || 0,
      liked_by_users: event.liked_by_users || [],
      rsvp_yes: event.rsvp_yes,
      rsvp_maybe: event.rsvp_maybe,
    }));
  }, [filteredEvents]);

  const panelData: PanelEventData = React.useMemo(() => {
    const selectedIndex = selectedEventId ? panelEvents.findIndex((event) => event.id === selectedEventId) : 0;

    return {
      events: panelEvents,
      currentIndex: selectedIndex >= 0 ? selectedIndex : 0,
    };
  }, [panelEvents, selectedEventId]);

  const generatePerfectDay = async () => {
    setIsPerfectDayLoading(true);
    try {
      const username = localStorage.getItem("community_chat_username") || "Gast";
      const userInterests = JSON.parse(localStorage.getItem("user_interests") || "[]");
      const userLocations = JSON.parse(localStorage.getItem("user_locations") || "[]");
      const weather = sessionStorage.getItem("weather") || "partly_cloudy";

      const { data, error } = await supabase.functions.invoke("generate-perfect-day", {
        body: {
          username,
          weather,
          interests: userInterests,
          favorite_locations: userLocations,
        },
      });

      if (error) throw error;

      setPerfectDayMessage(data.response);
      setShowPerfectDayPanel(true);

      toast({
        title: "Perfect Day generiert!",
        description: "Deine personalisierte Tagesempfehlung ist bereit.",
      });
    } catch (error: any) {
      console.error("Error generating Perfect Day:", error);
      toast({
        title: "Fehler",
        description: "Perfect Day konnte nicht generiert werden: " + (error.message || "Unbekannter Fehler."),
        variant: "destructive",
      });
    } finally {
      setIsPerfectDayLoading(false);
    }
  };

  const handleJoinEventChat = async (eventId: string, eventTitle: string) => {
    try {
      const groupId = await eventChatService.joinEventChat(eventId, eventTitle);

      if (groupId) {
        setEventChatWindow({
          eventId,
          eventTitle,
          isOpen: true,
        });

        toast({
          title: "Event Chat geöffnet",
          description: `Chat für "${eventTitle}" wurde geöffnet`,
        });
      } else {
        toast({
          title: "Fehler",
          description: "Event Chat konnte nicht erstellt werden",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining event chat:", error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  const updateUserPosition = async (username: string, newLat: number, newLng: number) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          current_live_location_lat: newLat,
          current_live_location_lng: newLng,
          last_online: new Date().toISOString(),
        })
        .eq("username", username);

      if (error) throw error;

      console.log(`Updated position for ${username} to ${newLat}, ${newLng}`);
    } catch (error: any) {
      console.error("Error updating user position:", error);
      toast({
        title: "Fehler",
        description: "Position konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleCheckInWithStatus = async () => {
    const username = currentUser || localStorage.getItem("community_chat_username") || "Gast";
    const avatar =
      userProfile?.avatar ||
      localStorage.getItem("community_chat_avatar") ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;

    setCentralAvatarUsername(username);
    setCentralAvatarImage(avatar);
    setShowCentralAvatar(true);

    const checkInToast = toast({
      title: "Check-in wird verarbeitet...",
      duration: Infinity,
    });

    try {
      const userCurrentCityCenter = getCityCenterCoordinates(selectedCity);
      const userCurrentLat = userCurrentCityCenter.lat + (Math.random() - 0.5) * 0.005;
      const userCurrentLng = userCurrentCityCenter.lng + (Math.random() - 0.5) * 0.005;

      if (username && username !== "Gast") {
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
          .from("user_profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (existingProfile) {
          await supabase.from("user_profiles").update(profileData).eq("username", username);
        } else {
          await supabase.from("user_profiles").insert(profileData);
        }

        refetchProfile();
      }

      const communityMessage = liveStatusMessage
        ? `📍 ${username} ist jetzt hier: "${liveStatusMessage}"`
        : `📍 ${username} ist jetzt in der Nähe!`;

      const cityCommunityGroupId =
        cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.abbr.toLowerCase() + "_ausgehen" ||
        "bi_ausgehen";

      await messageService.sendMessage(cityCommunityGroupId, username, communityMessage, avatar);

      toast({
        title: "Erfolgreich eingecheckt!",
        description: liveStatusMessage
          ? `Dein Status: "${liveStatusMessage}" wurde geteilt.`
          : "Dein Standort wurde persistent gespeichert.",
      });
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast({
        title: "Fehler",
        description: error.message || "Es gab ein Problem beim Einchecken.",
        variant: "destructive",
      });
    } finally {
      setLiveStatusMessage("");
      checkInToast.dismiss();
      setShowCentralAvatar(false);
    }
  };

  const goToAIChat = () => {
    setShowAIChat(true);
    chatLogic.handleExternalQuery("Hallo KI, welche Events gibt es heute?");
  };

  const handleOpenEventForm = async (eventData: any) => {
    try {
      const cityObject = cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase());
      const cityName = cityObject ? cityObject.name : selectedCity;

      const eventWithCity = { ...eventData, city: cityName };

      console.log("Adding new event to database only:", eventWithCity);
      await addUserEvent(eventWithCity);
      toast({
        title: "Event erfolgreich erstellt!",
        description: `${eventData.title} wurde hinzugefügt.`,
      });
      refreshEvents();
      setIsEventFormOpen(false);
    } catch (error: any) {
      console.error("Error adding event:", error);
      toast({
        title: "Fehler",
        description: "Event konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    // Always cleanup any existing map first
    if (map) {
      console.log("[EventHeatmap] Cleaning up existing map before creating new one");
      try {
        map.remove();
      } catch (error) {
        console.warn("[EventHeatmap] Error removing existing map:", error);
      }
      setMap(null);
    }

    const initializeMap = () => {
      if (!mapRef.current) return;

      console.log("[EventHeatmap] Initializing map for city:", selectedCity);
      const initialCenter = getCityCenterCoordinates(selectedCity);

      try {
        const leafletMap = L.map(mapRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: 13,
          attributionControl: false,
          zoomControl: false,
          preferCanvas: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "",
          maxZoom: 19,
          className: "map-tiles",
        }).addTo(leafletMap);

        setMap(leafletMap);

        setTimeout(() => {
          if (leafletMap && leafletMap.getContainer()) {
            leafletMap.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error("[EventHeatmap] Error initializing map:", error);
      }
    };

    const timeoutId = setTimeout(initializeMap, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapRef.current, selectedCity]);

  // Final cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (map) {
        console.log("[EventHeatmap] Final cleanup on unmount");
        try {
          map.remove();
        } catch (error) {
          console.warn("[EventHeatmap] Error during final cleanup:", error);
        }
        setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (currentTribeSpotMarkersRef.current) {
      currentTribeSpotMarkersRef.current.forEach((marker) => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    }
    currentTribeSpotMarkersRef.current = [];

    if (!map || (selectedCity.toLowerCase() !== "bi" && selectedCity.toLowerCase() !== "bielefeld")) {
      setTribeSpotMarkers([]);
      return;
    }

    const newTribeSpotMarkers: L.Marker[] = [];

    tribeSpots.forEach((spot) => {
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
        className: "custom-tribe-spot-marker",
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

      marker.on("click", () => {
        setSelectedTribeSpot(spot);
        setIsTribeSpotDialogOpen(true);
      });

      const usersAtSpot = allUserProfiles.filter((user) => {
        const hasLiveLocation = user.current_live_location_lat !== null && user.current_live_location_lng !== null;
        if (!hasLiveLocation) return false;

        const distance = Math.sqrt(
          Math.pow(user.current_live_location_lat! - spot.lat, 2) +
            Math.pow(user.current_live_location_lng! - spot.lng, 2),
        );
        return distance < 0.002;
      });

      try {
        if (map && map.getContainer()) {
          marker.addTo(map);
          newTribeSpotMarkers.push(marker);
        }
      } catch (error) {
        console.warn("[EventHeatmap] Error adding tribe spot marker:", error);
      }
    });

    setTribeSpotMarkers(newTribeSpotMarkers);
    currentTribeSpotMarkersRef.current = newTribeSpotMarkers;

    return () => {
      newTribeSpotMarkers.forEach((marker) => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, selectedCity, allUserProfiles, currentUser, userProfile, refetchProfile]);

  useEffect(() => {
    if (!map) {
      eventMarkers.forEach((marker) => {
        try {
          map?.removeLayer(marker);
        } catch (e) {}
      });
      setEventMarkers([]);
      return;
    }

    const markersToRemove = [...eventMarkers];
    markersToRemove.forEach((marker) => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    const newEventMarkers: L.Marker[] = [];

    filteredEvents.forEach((event) => {
      const coords = eventCoordinates.get(event.id);
      const lat = coords?.lat || event.lat;
      const lng = coords?.lng || event.lng;

      if (typeof lat !== "number" || isNaN(lat) || typeof lng !== "number" || isNaN(lng)) {
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
          <img src="${event.image_url || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop;"}"
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
        className: "custom-event-marker",
        iconSize: [markerSize, markerSize + 20],
        iconAnchor: [markerSize / 2, markerSize + 20],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on("click", async () => {
        setSelectedEventId(event.id);
        setIsPanelOpen(true);
        setPanelHeight("partial");
        setShowPerfectDayPanel(false);
        await fetchAndShowEventDescription(event);
      });

      const popupContent = `
        <div style="min-width: 200px; max-width: 250px; font-family: sans-serif;">
          ${event.image_url ? `<img src="${event.image_url}" onerror="this.src='https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"/>` : ""}
          <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${event.title}</h3>

          <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 12px;">
            <span style="margin-right: 5px;">📍</span>
            <span>${event.location || "Bielefeld"}</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 4px; color: #6b7280; font-size: 12px;">
            <span style="margin-right: 5px;">📅</span>
            <span>Heute, ${event.time} Uhr</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280; font-size: 12px;">
            <span style="margin-right: 5px;">❤️</span>
            <span>${event.likes || 0} Likes</span>
          </div>
          ${event.description ? `<p style="margin-bottom: 8px; font-size: 11px; color: #4b5563; max-height: 60px; overflow: hidden;">${event.description}</p>` : ""}
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
          ${event.link ? `<div style="margin-top: 8px;"><a href="${event.link}" target="_blank" style="color: #ef4444; text-decoration: underline; font-size: 12px;">Mehr Info</a></div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);

      try {
        if (map && map.getContainer()) {
          marker.addTo(map);
          newEventMarkers.push(marker);
        }
      } catch (error) {
        console.warn("[EventHeatmap] Error adding event marker:", error);
      }
    });

    setEventMarkers(newEventMarkers);

    return () => {
      newEventMarkers.forEach((marker) => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, filteredEvents, selectedCity, eventCoordinates]);

  useEffect(() => {
    if (!map) {
      userMarkers.forEach((marker) => {
        try {
          map?.removeLayer(marker);
        } catch (e) {}
      });
      setUserMarkers([]);
      return;
    }

    const markersToRemove = [...userMarkers];
    markersToRemove.forEach((marker) => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    const newUserMarkers: L.Marker[] = [];
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    allUserProfiles.forEach((user) => {
      const userCity = user.favorite_locations?.[0]?.toLowerCase() || "bielefeld";
      const selectedCityName =
        cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name?.toLowerCase() ||
        selectedCity.toLowerCase();

      let isUserInCurrentCity = false;
      if (selectedCityName === "bielefeld" || selectedCityName === "bi") {
        isUserInCurrentCity = !userCity || userCity === "bielefeld" || userCity === "bi";
      } else {
        isUserInCurrentCity = userCity === selectedCityName;
      }

      if (!isUserInCurrentCity) return;

      const hasLiveLocation =
        user.current_live_location_lat !== null &&
        user.current_live_location_lng !== null &&
        user.current_live_location_lat !== undefined &&
        user.current_live_location_lng !== undefined;
      const hasStatusMessage = user.current_status_message && user.current_status_message.trim() !== "";
      const isRecentCheckin =
        user.current_checkin_timestamp &&
        new Date().getTime() - new Date(user.current_checkin_timestamp).getTime() < TWO_HOURS_MS;

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
            <img src="${user.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=" + getInitials(user.username)}"
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
          className: "user-marker",
          iconSize: [60, 90],
          iconAnchor: [30, 90],
        });

        const marker = L.marker([lat, lng], {
          icon: userMarkerIcon,
          draggable: user.username === currentUser,
        });

        marker.on("click", () => {
          setSelectedUserForPrivateChat(user);
          setIsPrivateChatOpen(true);
        });

        if (user.username === currentUser) {
          marker.on("dragend", (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            console.log(`User ${user.username} moved to:`, position.lat, position.lng);

            updateUserPosition(user.username, position.lat, position.lng);
          });
        }

        newUserMarkers.push(marker);

        try {
          if (map && map.getContainer()) {
            map.addLayer(marker);
          }
        } catch (error) {
          console.warn("[EventHeatmap] Error adding user marker:", error);
        }
      }
    });
    setUserMarkers(newUserMarkers);

    return () => {
      newUserMarkers.forEach((marker) => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, allUserProfiles, currentUser, selectedCity]);

  const handleEventSelect = async (eventId: string) => {
    setSelectedEventId(eventId);

    const selectedEvent = filteredEvents.find(
      (event) => (event.id || `${event.title}-${event.date}-${event.time}`) === eventId,
    );

    if (selectedEvent && selectedEvent.lat && selectedEvent.lng && map) {
      map.setView([selectedEvent.lat, selectedEvent.lng], 15);
    }

    await fetchAndShowEventDescription(selectedEvent);
  };

  const handleEventLike = async (eventId: string) => {
    try {
      const event = filteredEvents.find((e) => (e.id || `${e.title}-${e.date}-${e.time}`) === eventId);
      if (!event || !event.id) return;
      await handleLikeEvent(event.id);
    } catch (error: any) {
      console.error("Error liking event:", error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  const handleEventDislike = async (eventId: string) => {
    try {
      const event = filteredEvents.find((e) => {
        const eId = e.id || `${e.title}-${e.date}-${e.time}`;
        return eId === eventId;
      });

      console.log("[EventHeatmap] Disliking event:", eventId, "location:", event?.location);
      const result = await dislikeService.dislikeEvent(eventId, event?.location);

      setDislikedEventIds((prev) => {
        if (!prev.includes(eventId)) {
          return [...prev, eventId];
        }
        return prev;
      });

      if (result.shouldAskBlock && result.location) {
        setLocationToBlock(result.location);
        setIsBlockLocationDialogOpen(true);
      }

      toast({
        title: "Event ausgeblendet",
        description: "Das Event wird nicht mehr angezeigt",
      });
    } catch (error: any) {
      console.error("Error disliking event:", error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  const handleBlockLocation = () => {
    if (locationToBlock) {
      dislikeService.blockLocation(locationToBlock);
      toast({
        title: "Location blockiert",
        description: `Alle Events von "${locationToBlock}" werden ausgeblendet`,
      });
      setDislikedEventIds((prev) => [...prev]);
    }
    setIsBlockLocationDialogOpen(false);
    setLocationToBlock(null);
  };

  const togglePanelHeight = () => {
    if (panelHeight === "collapsed") {
      setPanelHeight("partial");
      setIsPanelOpen(true);
    } else if (panelHeight === "partial") {
      setPanelHeight("full");
    } else {
      setPanelHeight("collapsed");
      setIsPanelOpen(false);
    }
  };

  const closePanelCompletely = () => {
    setPanelHeight("collapsed");
    setIsPanelOpen(false);
    setShowPerfectDayPanel(false);
  };

  const handleAIChatSend = async (messageContent?: string) => {
    const message = messageContent || aiChatInput;
    if (message.trim()) {
      await chatLogic.handleSendMessage(message);
      setAiChatInput("");
    }
  };

  const handleTribeSpotCheckIn = async () => {
    if (!selectedTribeSpot) return;

    const username = currentUser || localStorage.getItem("community_chat_username") || "Gast";
    const avatar =
      userProfile?.avatar ||
      localStorage.getItem("community_chat_avatar") ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(username)}`;

    try {
      const profileData = {
        username,
        avatar,
        last_online: new Date().toISOString(),
        current_live_location_lat: selectedTribeSpot.lat,
        current_live_location_lng: selectedTribeSpot.lng,
        current_status_message: `📍 @ ${selectedTribeSpot.name}`,
        current_checkin_timestamp: new Date().toISOString(),
      };

      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existingProfile) {
        await supabase.from("user_profiles").update(profileData).eq("username", username);
      } else {
        await supabase.from("user_profiles").insert(profileData);
      }

      const cityCommunityGroupId =
        cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.abbr.toLowerCase() + "_ausgehen" ||
        "bi_ausgehen";
      await messageService.sendMessage(
        cityCommunityGroupId,
        username,
        `🏛️ ${username} ist jetzt am ${selectedTribeSpot.name}!`,
        avatar,
      );

      toast({
        title: `Check-in am ${selectedTribeSpot.name}!`,
        description: "Du bist jetzt am Tribe Spot eingecheckt.",
      });

      refetchProfile();
      setIsTribeSpotDialogOpen(false);
    } catch (error: any) {
      console.error("Tribe spot check-in failed:", error);
      toast({
        title: "Fehler",
        description: "Check-in am Tribe Spot fehlgeschlagen.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEventFormForModal = () => {
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

  const selectedCategoryData = categories.find((cat) => cat.name === "alle");
  const selectedCategoryDisplay = selectedCategory === "alle" ? "Alle" : selectedCategory;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ height: "100dvh" }}>
      {/* Live Ticker Header */}
      <HeatmapHeader
        selectedCity={selectedCity}
        chatInputProps={{
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
          onAddEvent: handleOpenEventFormForModal,
          showAnimatedPrompts: !aiChatInput.trim(),
          activeChatModeValue: "ai",
        }}
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((prev) => !prev)}
        onOpenSwipeMode={() => setIsSwipeModeOpen(true)}
        onMIAOpenChange={setIsMIAOpen}
        hasNewDailyRecommendation={hasNewDailyRecommendation}
        onMIAClick={handleMIAClick}
        isDailyRecommendationLoading={isDailyRecommendationLoading}
      />

      {/* Filter Panel (Conditional Rendering) - Hide when MIA is open */}
      {showFilterPanel && !isMIAOpen && (
        <div className="fixed top-60 left-4 z-[1003] space-y-3 max-w-sm animate-fade-in">
          <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Events für {format(selectedDate, "dd.MM.yyyy")} in{" "}
              {cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity}
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
                        {format(selectedDate, "dd.MM.yyyy")}
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

              {/* Filter Bar */}
              <div className="w-full overflow-x-auto">
                <FilterBar
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  variant="light"
                  className="min-w-max"
                />
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

      {/* Kategorie Filter - Horizontal ausklappbar */}
      <div className={cn("fixed top-24 left-3 z-[1002]", isMIAOpen && "hidden")}>
        <div className="flex items-center gap-2">
          {/* Aktueller Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCategoryOptions(!showCategoryOptions)}
            className="bg-black/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 h-auto rounded-lg hover:bg-black border border-white/10 transition-all"
          >
            {selectedCategory === "alle"
              ? "🌟 Alle"
              : selectedCategory === "ausgehen"
                ? "🎉 Ausgehen"
                : selectedCategory === "sport"
                  ? "⚽ Sport"
                  : "🎨 Kreativität"}
          </Button>

          {/* Horizontale Kategorie-Optionen */}
          {showCategoryOptions && (
            <div className="flex gap-2 animate-slide-in-right">
              {selectedCategory !== "alle" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleCategoryChange("alle");
                    setShowCategoryOptions(false);
                  }}
                  className="bg-black/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 h-auto rounded-lg hover:bg-white/20 border border-white/10 transition-all"
                >
                  🌟 Alle
                </Button>
              )}
              {selectedCategory !== "ausgehen" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleCategoryChange("ausgehen");
                    setShowCategoryOptions(false);
                  }}
                  className="bg-black/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 h-auto rounded-lg hover:bg-white/20 border border-white/10 transition-all"
                >
                  🎉 Ausgehen
                </Button>
              )}
              {selectedCategory !== "sport" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleCategoryChange("sport");
                    setShowCategoryOptions(false);
                  }}
                  className="bg-black/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 h-auto rounded-lg hover:bg-white/20 border border-white/10 transition-all"
                >
                  ⚽ Sport
                </Button>
              )}
              {selectedCategory !== "kreativität" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleCategoryChange("kreativität");
                    setShowCategoryOptions(false);
                  }}
                  className="bg-black/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 h-auto rounded-lg hover:bg-white/20 border border-white/10 transition-all"
                >
                  🎨 Kreativität
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date Picker - Über dem Zeitslider */}
      <div className={cn("fixed top-32 right-2 z-[1002]", isMIAOpen && "hidden")}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/90 backdrop-blur-md text-white text-[10px] px-2 py-1.5 h-auto rounded-lg hover:bg-black border border-white/10 transition-all flex flex-col items-center gap-0.5 min-w-[3.5rem]"
            >
              <span className="font-bold">{format(selectedDate, "EEE", { locale: de })}</span>
              <span className="text-[13px] font-bold">{format(selectedDate, "dd.MM.")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 z-[9999]" align="end">
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

      {/* Time Slider - Extrem minimal */}
      <div className={cn("fixed top-44 right-2 z-[1002]", isMIAOpen && "hidden")}>
        <div className="p-1 bg-black/25 backdrop-blur-sm rounded-full">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-white text-[11px] font-bold">{timeRange[0]}h</span>
            <div className="h-28 w-4">
              <Slider
                value={timeRange}
                onValueChange={setTimeRange}
                max={23}
                min={0}
                step={1}
                orientation="vertical"
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Button to show events panel again if hidden */}
      {!showEventPanels && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <Button
            onClick={() => setShowEventPanels(true)}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 text-sm"
          >
            Events anzeigen
          </Button>
        </div>
      )}

      {/* Default Event Display - Always visible above navbar (versteckt wenn MIA offen) */}
      {!showPerfectDayPanel && filteredEvents.length > 0 && showEventPanels && !isMIAOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-[1000] pointer-events-auto">
          <div className="px-2 py-4">
            <ThreeEventDisplay
              panelData={panelData}
              onEventSelect={handleEventSelect}
              onLikeEvent={handleEventLike}
              onDislikeEvent={handleEventDislike}
              onJoinEventChat={handleJoinEventChat}
              className="w-full"
              onSwipeDownToHide={() => setShowEventPanels(false)}
            />
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full map-container"
        style={{
          height: "100vh",
          minHeight: "100vh",
          zIndex: 1,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* === Styles (Map tint + Chips + Tight paragraphs) === */}
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

        /* Inline chips for all anchors in AI content */
        .ai-content a.ai-chip, .ai-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 12px;
          line-height: 1;
          border-radius: 9999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          text-decoration: none;
          white-space: nowrap;
          transition: transform .12s ease, background .12s ease, border-color .12s ease;
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
        }
        .ai-content a.ai-chip:hover, .ai-chip:hover {
          transform: translateY(-1px);
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.35);
        }
        .ai-content a.ai-chip:active, .ai-chip:active {
          transform: translateY(0);
        }
        .ai-content p { margin: .4rem 0; }
      `}</style>

      {/* Onboarding Dialog */}
      {isOnboardingActive && (
        <OnboardingDialog
          onClose={() => setIsOnboardingActive(false)}
          onComplete={(action) => {
            setIsOnboardingActive(false);
            setIsMIAOpen(false);
            toast({
              title: "Onboarding abgeschlossen!",
              description: "Viel Spaß beim Entdecken von Events!",
            });
          }}
        />
      )}

      {/* === AI Response Card (modern) === */}
      {showAiResponse && !isOnboardingActive && (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:w-[520px] z-[1100] animate-fade-in">
          <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(239,68,68,0.25)]">
            {/* Gradient ring */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background:
                  "radial-gradient(120% 60% at 100% 0%, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.05) 30%, transparent 60%)",
              }}
            />
            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-red-500/30 blur-md" />
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center ring-2 ring-white/10">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold leading-tight">MIA</div>
                  <div className="text-[11px] text-white/50">Deine Event-Assistentin</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAiResponse(false);
                  setAiResponse(null);
                  setAiSuggestions([]);
                  setIsMIAOpen(false);
                }}
                className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="relative max-h-[66vh] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
              {isAiChatLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/70" />
                    <p className="text-white/70 text-sm">MIA denkt nach…</p>
                  </div>
                </div>
              ) : aiResponse ? (
                <>
                  <div
                    className="text-white text-[14px] leading-6 ai-content"
                    dangerouslySetInnerHTML={{ __html: aiResponse }}
                  />
                  {aiSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[11px] text-white/50 mb-2">Weiter fragen:</div>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={async () => {
                              try {
                                // Special handling for inline suggestions
                                if (s === '🎉 Ich bin dabei' || s === 'Ich bin dabei') {
                                  if (currentAiEventContext?.id) {
                                    (window as any).handleAttendEvent?.(currentAiEventContext.id);
                                    return;
                                  }
                                }
                                if (s === 'Treffen vorschlagen') {
                                  if (currentAiEventContext?.id) {
                                    (window as any).handleProposeMeetup?.(currentAiEventContext.id, currentAiEventContext.title);
                                    return;
                                  }
                                }
                                setAiChatInput(s);
                                setAiResponse(null);
                                setAiSuggestions([]);
                                setIsAiChatLoading(true);
                                if (aiChatExternalSendHandler) await aiChatExternalSendHandler(s);
                                else if ((chatLogic as any)?.handleSendMessage)
                                  await (chatLogic as any).handleSendMessage(s);
                                setAiChatInput("");
                              } catch {
                                toast.error("Konnte Antwort nicht laden");
                                setAiResponse(
                                  enhanceLinksToChips(
                                    '<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">Leider keine Antwort. Bitte erneut versuchen.</div>',
                                  ),
                                );
                                setAiSuggestions(["Was läuft heute?", "Events am Wochenende"]);
                              } finally {
                                setIsAiChatLoading(false);
                              }
                            }}
                            className="ai-chip"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Input */}
            <div className="relative border-t border-white/10 p-3 bg-black/60 backdrop-blur-xl">
              <div className="flex gap-2">
                <Input
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!aiChatInput.trim()) return;
                      const q = aiChatInput;
                      setAiChatInput("");
                      setAiResponse(null);
                      setAiSuggestions([]);
                      try {
                        setIsAiChatLoading(true);
                        if (aiChatExternalSendHandler) await aiChatExternalSendHandler(q);
                        else if ((chatLogic as any)?.handleSendMessage) await (chatLogic as any).handleSendMessage(q);
                        else throw new Error("Kein Send-Handler verfügbar");
                      } catch {
                        toast.error("Konnte Antwort nicht laden");
                        setAiResponse(
                          enhanceLinksToChips(
                            '<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">Leider keine Antwort. Bitte erneut versuchen.</div>',
                          ),
                        );
                        setAiSuggestions(["Was läuft heute?", "Events am Wochenende"]);
                      } finally {
                        setIsAiChatLoading(false);
                      }
                    }
                  }}
                  placeholder="Frag MIA nach Events…"
                  className="flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/50 rounded-xl"
                  disabled={isAiChatLoading}
                />
                <Button
                  size="icon"
                  onClick={async () => {
                    if (!aiChatInput.trim()) return;
                    const q = aiChatInput;
                    setAiChatInput("");
                    setAiResponse(null);
                    setAiSuggestions([]);
                    try {
                      setIsAiChatLoading(true);
                      if (aiChatExternalSendHandler) await aiChatExternalSendHandler(q);
                      else if ((chatLogic as any)?.handleSendMessage) await (chatLogic as any).handleSendMessage(q);
                      else throw new Error("Kein Send-Handler verfügbar");
                    } catch {
                      toast.error("Konnte Antwort nicht laden");
                      setAiResponse(
                        enhanceLinksToChips(
                          '<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 text-sm">Leider keine Antwort. Bitte erneut versuchen.</div>',
                        ),
                      );
                      setAiSuggestions(["Was läuft heute?", "Events am Wochenende"]);
                    } finally {
                      setIsAiChatLoading(false);
                    }
                  }}
                  disabled={isAiChatLoading}
                  className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Central Avatar Modal */}
      {showCentralAvatar && (
        <div className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-red-500 shadow-lg">
                <img
                  src={
                    centralAvatarImage ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(centralAvatarUsername)}`
                  }
                  alt={centralAvatarUsername}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{centralAvatarUsername}</h2>
              <p className="text-gray-600">
                Was machst du gerade? Setze deinen Status und verbinde dich mit anderen Tribes!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center relative w-full">
                <Input
                  placeholder="Was machst du gerade? (z.B. Jetzt im Café Barcelona)"
                  value={liveStatusMessage}
                  onChange={(e) => setLiveStatusMessage(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-red-500 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-800 placeholder-gray-500 pr-12"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
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
                    liveStatusMessage.trim() ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-300 text-gray-500",
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
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Perfect Day</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={goToAIChat} className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1">
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

          <div className="p-4 overflow-y-auto h-full">
            <div dangerouslySetInnerHTML={{ __html: perfectDayMessage }} />
          </div>
        </div>
      )}

      {/* AI Chat Drawer - DEPRECATED, using MIA Response Card instead */}
      {showAIChat && (
        <>
          <div
            className="fixed inset-0 z-[900] bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAIChat(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-[1200] animate-slide-in-bottom">
            <div className="bg-gradient-to-t from-black via-gray-950/95 to-gray-900/90 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t-2 border-red-500/30 h-[26vh] flex flex-col">
              <div className="flex justify-center py-3 cursor-pointer" onClick={() => setShowAIChat(false)}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"></div>
              </div>

              <div className="px-6 pb-4 flex items-center justify-between border-b border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg animate-pulse"></div>
                    <Avatar className="relative w-12 h-12 ring-2 ring-red-400/30 shadow-lg shadow-red-500/50">
                      <AvatarImage src="/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png" />
                      <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white font-bold">
                        MIA
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">MIA</h2>
                    <p className="text-xs text-red-400 font-medium">Deine Event Assistentin</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAIChat(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all h-10 w-10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden min-h-0 p-4 text-white/70 text-sm">
                Dieser Dialog wurde durch das neue MIA Response Card ersetzt.
              </div>
            </div>
          </div>
        </>
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
            onAddEvent={handleOpenEventForm}
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
      <TribeFinder open={isTribeFinderOpen} onOpenChange={setIsTribeFinderOpen} />

      {/* Tribe Spot Dialog */}
      <Dialog open={isTribeSpotDialogOpen} onOpenChange={setIsTribeSpotDialogOpen}>
        <DialogContent className="sm:max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="text-4xl mb-2">🏛️</div>
              <div className="text-xl font-bold">{selectedTribeSpot?.name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                Tribe Spot • Treffpunkt für deine Community!
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Checke dich am {selectedTribeSpot?.name} ein und zeige anderen, dass du hier bist!
                <br />
                Dein Check-in wird im Community Chat geteilt, damit du dich mit Gleichgesinnten verbinden kannst.
              </p>

              {selectedTribeSpot && (
                <div className="mb-4">
                  {(() => {
                    const usersAtSpot = allUserProfiles.filter((user) => {
                      const hasLiveLocation =
                        user.current_live_location_lat !== null && user.current_live_location_lng !== null;
                      if (!hasLiveLocation) return false;

                      const distance = Math.sqrt(
                        Math.pow(user.current_live_location_lat! - selectedTribeSpot.lat, 2) +
                          Math.pow(user.current_live_location_lng! - selectedTribeSpot.lng, 2),
                      );
                      return distance < 0.002;
                    });

                    return usersAtSpot.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">🔥 Wer ist hier? ({usersAtSpot.length})</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {usersAtSpot.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-2 bg-muted px-2 py-1 rounded-full text-xs"
                            >
                              <img
                                src={
                                  user.avatar ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(user.username)}`
                                }
                                className="w-4 h-4 rounded-full border"
                                alt={user.username}
                              />
                              <span className="font-medium">{user.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsTribeSpotDialogOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={handleTribeSpotCheckIn}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Check-in!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog - disabled for MIA inline mode */}
      {false && showEventDetails && selectedEventForDetails && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="relative z-[9999] w-full max-w-lg mx-auto">
            <EventDetails
              event={selectedEventForDetails}
              onClose={() => setShowEventDetails(false)}
              onJoinChat={handleJoinEventChat}
            />
          </div>
        </div>
      )}

      {/* Event Chat Window */}
      {eventChatWindow && (
        <EventChatWindow
          eventId={eventChatWindow.eventId}
          eventTitle={eventChatWindow.eventTitle}
          isOpen={eventChatWindow.isOpen}
          onClose={() => setEventChatWindow(null)}
        />
      )}

      {/* Event Swipe Mode */}
      <EventSwipeMode
        open={isSwipeModeOpen}
        onOpenChange={setIsSwipeModeOpen}
        events={filteredEvents}
        onLikeEvent={handleEventLike}
      />

      {/* Location Blocking Dialog */}
      <AlertDialog open={isBlockLocationDialogOpen} onOpenChange={setIsBlockLocationDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">
              Alle Events von "{locationToBlock}" ausblenden?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Du hast bereits 2 Events von dieser Location ausgeblendet. Möchtest du alle zukünftigen Events von "
              {locationToBlock}" automatisch ausblenden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsBlockLocationDialogOpen(false);
                setLocationToBlock(null);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            >
              Nein, danke
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockLocation} className="bg-red-600 hover:bg-red-700 text-white">
              Ja, alle ausblenden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventHeatmap;
