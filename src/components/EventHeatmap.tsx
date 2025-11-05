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
import { UserProfile } from "@/types/chatTypes";
import { getInitials } from "@/utils/chatUIUtils";
import PrivateChat from "@/components/users/PrivateChat";
import HeatmapHeader from "./HeatmapHeader";
import { useEventContext, cities } from "@/contexts/EventContext";
import FullPageChatBot from "@/components/event-chat/FullPageChatBot";
import { useChatLogic } from "@/components/event-chat/useChatLogic";
import { geocodeLocation, loadCachedCoordinates, geocodeMultipleLocations } from "@/services/geocodingService";
import TribeFinder from "./TribeFinder";
import { eventChatService } from "@/services/eventChatService";
import EventChatWindow from "@/components/event-chat/EventChatWindow";
import EventSwipeMode from "./EventSwipeMode";
import EventDetails from "@/components/EventDetails";
import { dislikeService } from "@/services/dislikeService";

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

  // --- helper: convert links to inline chips (keeps href & handlers) ---
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

  // Callback to receive AI response directly in heatmap
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

  // ====== NEW: helper to render + fetch description via Edge Function ======
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
      handleAiResponseReceived(html, ["Weitere Events heute", "Events am Wochenende"]);
    } catch (e) {
      toast.error("Konnte Eventbeschreibung nicht laden");
      const html = renderEventHtml(evt, "Keine Beschreibung verfügbar. Versuche es später erneut.");
      handleAiResponseReceived(html, ["Was läuft heute?", "Events am Wochenende"]);
    } finally {
      setIsAiChatLoading(false);
    }
  };
  // ====== /NEW helpers ======

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

    // Register additional handlers for event detail buttons
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
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("event://")) return;
      e.preventDefault();

      // extended routing for chips:
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

      const eventId = href.slice("event://".length);
      console.log("[EventHeatmap] Captured event:// link", { href, eventId });
      if (eventId && (window as any).handleEventLinkClick) {
        (window as any).handleEventLinkClick(eventId);
      } else {
        console.warn("[EventHeatmap] handleEventLinkClick missing or empty id");
      }
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("touchend", handler as EventListener, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("touchend", handler as EventListener, true);
    };
  }, []);

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

      console.log("[EventHeatmap] Starting geocoding for events...");

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
          // Use currentCityEvents here as well
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
        const hasLocationData = event.location || event.city;

        const eventCityLower = event.city ? event.city.toLowerCase() : null;
        const selectedCityLower = selectedCity.toLowerCase();

        let isRelevantCity = false;
        if (selectedCityLower === "bi" || selectedCityLower === "bielefeld") {
          isRelevantCity = !eventCityLower || eventCityLower === "bielefeld" || eventCityLower === "bi";
        } else {
          isRelevantCity = eventCityLower === selectedCityLower;
        }

        console.log(
          `Event: ${event.title}, Date: ${event.date}, Location: ${event.location}, City: ${event.city}, IsSelectedDate: ${isSelectedDateEvent}, HasLocation: ${hasLocationData}, IsRelevantCity: ${isRelevantCity}`,
        );

        // Modified to show events even without geocoding working
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
      // Special case: "ausgehen" shows all events EXCEPT sport events
      if (selectedCategory === "ausgehen") {
        filtered = filtered.filter((event) => {
          const eventCategoryGroup = getCategoryGroup(event.category);
          return eventCategoryGroup !== "Sport";
        });
      } else {
        // For 'sport' and 'kreativität', filter to specific category group
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

    // Sort events by likes in descending order
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
        // Open event chat window
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

  // Only one declaration for handleOpenEventForm
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

    // Small delay to ensure cleanup is complete
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

        // Force map to invalidate size after a short delay
        setTimeout(() => {
          if (leafletMap && leafletMap.getContainer()) {
            leafletMap.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error("[EventHeatmap] Error initializing map:", error);
      }
    };

    // Initialize map with a small delay to ensure cleanup is complete
    const timeoutId = setTimeout(initializeMap, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapRef.current, selectedCity]); // Add selectedCity back to ensure proper reinitialization

  // City changes are handled by map reinitialization in the effect above

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
  }, []); // Empty dependency array for unmount only

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

      // Only add marker if map is valid and has a container
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
      const imageSize
