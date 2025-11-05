// EventHeatmap.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- shadcn/ui (nur was wirklich genutzt wird) ---
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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

// --- Icons ---
import {
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter as FilterIcon,
  FilterX,
  X,
} from "lucide-react";

// --- Project Hooks/Services/Utils (wie bei dir im Projekt vorhanden) ---
import { useEvents } from "@/hooks/useEvents";
import { useUserProfile } from "@/hooks/chat/useUserProfile";
import { useEventContext, cities } from "@/contexts/EventContext";
import { dislikeService } from "@/services/dislikeService";
import { eventChatService } from "@/services/eventChatService";
import { messageService } from "@/services/messageService";
import { geocodeMultipleLocations, loadCachedCoordinates } from "@/services/geocodingService";
import { useChatLogic } from "@/components/event-chat/useChatLogic";
import EventForm from "@/components/EventForm";
import { getCategoryGroup, CategoryGroup } from "@/utils/eventCategoryGroups";
import { getSelectedCategory, saveSelectedCategory } from "@/utils/heatmapPreferences";
import { getInitials } from "@/utils/chatUIUtils";
import { supabase } from "@/integrations/supabase/client";
import HeatmapHeader from "./HeatmapHeader";

// --- date-fns ---
import { format } from "date-fns";

// --- Types (nur minimal benötigt) ---
type FilterGroup = "alle" | "ausgehen" | "sport" | "kreativität";
type UserProfile = {
  id: string;
  username: string;
  avatar?: string;
  favorite_locations?: string[];
  current_live_location_lat?: number | null;
  current_live_location_lng?: number | null;
  current_status_message?: string | null;
  current_checkin_timestamp?: string | null;
};

// --- Leaflet Marker Icons fix (Webpack/Vite) ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// --- Tribe Spots (Bielefeld) ---
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

const fallbackImg =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop&q=80&auto=format";

const EventHeatmap: React.FC = () => {
  // --- Context / Data ---
  const { selectedCity } = useEventContext();
  const { events, isLoading, refreshEvents, addUserEvent, handleLikeEvent } = useEvents(selectedCity);
  const { currentUser, userProfile, refetchProfile } = useUserProfile();

  // --- Filters / UI State ---
  const [selectedCategory, setSelectedCategory] = useState<FilterGroup>(() => getSelectedCategory() as FilterGroup);
  const [timeRange, setTimeRange] = useState([new Date().getHours()]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- Map state ---
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [eventMarkers, setEventMarkers] = useState<L.Marker[]>([]);
  const [tribeSpotMarkers, setTribeSpotMarkers] = useState<L.Marker[]>([]);
  const tribeMarkersRef = useRef<L.Marker[]>([]);
  const [userMarkers, setUserMarkers] = useState<L.Marker[]>([]);
  const [eventCoordinates, setEventCoordinates] = useState<Map<string, { lat: number; lng: number }>>(new Map());

  // --- Panels / Chat ---
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState<"collapsed" | "partial" | "full">("collapsed");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isMIAOpen, setIsMIAOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiChatExternalSendHandler, setAiChatExternalSendHandler] = useState<
    ((input?: string | any) => Promise<void>) | null
  >(null);

  // --- Block/Dislike ---
  const [dislikedEventIds, setDislikedEventIds] = useState<string[]>([]);
  const [isBlockLocationDialogOpen, setIsBlockLocationDialogOpen] = useState(false);
  const [locationToBlock, setLocationToBlock] = useState<string | null>(null);

  // --- Perfect Day ---
  const [hasNewDailyRecommendation, setHasNewDailyRecommendation] = useState(false);
  const [isDailyRecommendationLoading, setIsDailyRecommendationLoading] = useState(false);

  // --- City center helper ---
  const getCityCenterCoordinates = (abbr: string) => {
    const centers: Record<string, { lat: number; lng: number }> = {
      bi: { lat: 52.0302, lng: 8.5311 },
      bielefeld: { lat: 52.0302, lng: 8.5311 },
      berlin: { lat: 52.52, lng: 13.405 },
      hamburg: { lat: 53.5511, lng: 9.9937 },
      köln: { lat: 50.935173, lng: 6.953101 },
      munich: { lat: 48.1351, lng: 11.582 },
      kopenhagen: { lat: 55.6833, lng: 12.5833 },
    };
    const key = abbr.toLowerCase();
    return centers[key] || centers["bielefeld"];
  };

  // --- Selected date string ---
  const selectedDateString = format(selectedDate, "yyyy-MM-dd");

  // --- Load cached geocoding once ---
  useEffect(() => {
    loadCachedCoordinates();
  }, []);

  // --- Daily recommendation badge (once/day) ---
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (localStorage.getItem("last_daily_recommendation_date") !== today) {
      setHasNewDailyRecommendation(true);
    }
  }, []);

  // --- Chat logic bindings ---
  const enhanceLinksToChips = (html: string) => {
    if (!html) return html;
    return html.replace(/<a\s/gi, '<a class="ai-chip" ');
  };
  const handleAiResponseReceived = useCallback((response: string, suggestions?: string[]) => {
    setAiResponse(enhanceLinksToChips(response));
    setAiSuggestions(suggestions || []);
    setIsAiChatLoading(false);
    setIsMIAOpen(true);
  }, []);
  const chatLogic = useChatLogic(
    false,
    "ai",
    (date: Date) => setSelectedDate(date),
    (cat: string) => {
      setSelectedCategory(cat as FilterGroup);
      saveSelectedCategory(cat as FilterGroup);
    },
    handleAiResponseReceived,
  );
  useEffect(() => {
    if (!aiChatExternalSendHandler) {
      try {
        setAiChatExternalSendHandler(() => (chatLogic as any)?.handleSendMessage);
      } catch {}
    }
  }, [chatLogic, aiChatExternalSendHandler]);

  // --- Category change ---
  const handleCategoryChange = (category: FilterGroup) => {
    setSelectedCategory(category);
    saveSelectedCategory(category);
  };

  // --- Geocode all event locations for the selected city ---
  useEffect(() => {
    const run = async () => {
      if (!events.length) return;

      const unique = new Set<string>();
      const payload: Array<{ location: string; city?: string }> = [];

      const cityLower = selectedCity.toLowerCase();
      const currentCityEvents = events.filter((e) => {
        const eCity = (e.city || "").toLowerCase();
        if (cityLower === "bi" || cityLower === "bielefeld") {
          return !eCity || eCity === "bielefeld" || eCity === "bi";
        }
        return eCity === cityLower;
      });

      currentCityEvents.forEach((e) => {
        if (e.location) {
          const key = `${e.location}_${e.city || selectedCity}`;
          if (!unique.has(key)) {
            unique.add(key);
            payload.push({ location: e.location, city: e.city || selectedCity });
          }
        }
      });

      if (!payload.length) return;
      try {
        const coords = await geocodeMultipleLocations(payload);
        const mapCoords = new Map<string, { lat: number; lng: number }>();
        currentCityEvents.forEach((e) => {
          if (!e.id || !e.location) return;
          const key = `${e.location}_${e.city || selectedCity}`;
          const hit = coords.get(key);
          if (hit) mapCoords.set(e.id, hit);
        });
        setEventCoordinates(mapCoords);
      } catch (err) {
        console.warn("[EventHeatmap] Batch geocoding failed:", err);
      }
    };
    run();
  }, [events, selectedCity]);

  // --- Derived: city filtered and date filtered events ---
  const selectedDateFilteredEvents = useMemo(() => {
    const cityLower = selectedCity.toLowerCase();
    return events
      .filter((e) => e.date === selectedDateString)
      .filter((e) => {
        const eCity = (e.city || "").toLowerCase();
        if (cityLower === "bi" || cityLower === "bielefeld") {
          return !eCity || eCity === "bielefeld" || eCity === "bi";
        }
        return eCity === cityLower;
      })
      .map((e) => {
        const center = getCityCenterCoordinates(selectedCity);
        const coord = e.id ? eventCoordinates.get(e.id) : undefined;
        return {
          ...e,
          lat: coord?.lat ?? center.lat,
          lng: coord?.lng ?? center.lng,
          eventHour: parseInt((e.time || "00:00").split(":")[0], 10),
          attendees: (e.rsvp_yes || 0) + (e.rsvp_maybe || 0) + (e.likes || 0),
        };
      });
  }, [events, selectedCity, selectedDateString, eventCoordinates]);

  // --- Apply dislikes / location block / category / timerange ---
  const filteredEvents = useMemo(() => {
    let list = [...selectedDateFilteredEvents];

    // Blocked locations
    const blocked = dislikeService.getBlockedLocations();
    list = list.filter((e) => !e.location || !blocked.includes(e.location));

    // Disliked ids
    list = list.filter((e) => !dislikedEventIds.includes(e.id ?? `${e.title}-${e.date}-${e.time}`));

    // Category filter
    if (selectedCategory !== "alle") {
      if (selectedCategory === "ausgehen") {
        list = list.filter((e) => getCategoryGroup(e.category) !== "Sport");
      } else {
        const map: Record<FilterGroup, CategoryGroup | null> = {
          alle: null,
          ausgehen: "Ausgehen",
          sport: "Sport",
          kreativität: "Kreativität",
        };
        const target = map[selectedCategory];
        if (target) list = list.filter((e) => getCategoryGroup(e.category) === target);
      }
    }

    // Time filter
    const hour = timeRange[0];
    list = list.filter((e) => e.eventHour >= hour);

    // Sort by “interest”
    list.sort((a, b) => {
      const A = (a.likes || 0) + (a.rsvp_yes || 0) + (a.rsvp_maybe || 0);
      const B = (b.likes || 0) + (b.rsvp_yes || 0) + (b.rsvp_maybe || 0);
      return B - A;
    });

    return list;
  }, [selectedDateFilteredEvents, selectedCategory, timeRange, dislikedEventIds]);

  // --- MAP: init / destroy ---
  useEffect(() => {
    if (!mapRef.current) return;

    // cleanup previous
    if (map) {
      try {
        map.remove();
      } catch {}
      setMap(null);
    }

    const center = getCityCenterCoordinates(selectedCity);
    const m = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      attributionControl: false,
      zoomControl: false,
      preferCanvas: false,
    });

    // Dark base map
    const tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      className: "tribe-tiles", // Wichtig: CSS tint ist per className
    });
    tiles.addTo(m);

    setMap(m);

    // fix size
    setTimeout(() => {
      try {
        m.invalidateSize();
      } catch {}
    }, 120);

    return () => {
      try {
        m.remove();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current, selectedCity]);

  // --- Tribe spots layer ---
  useEffect(() => {
    // cleanup old
    tribeMarkersRef.current.forEach((mk) => {
      try {
        map?.removeLayer(mk);
      } catch {}
    });
    tribeMarkersRef.current = [];

    if (!map) return;
    const cityLower = selectedCity.toLowerCase();
    if (cityLower !== "bi" && cityLower !== "bielefeld") return;

    const fresh: L.Marker[] = [];
    tribeSpots.forEach((spot) => {
      const icon = L.divIcon({
        className: "tribe-spot-icon",
        html: `
          <div class="tribe-spot-badge">
            <div class="tribe-spot-name">${spot.name}</div>
          </div>
        `,
        iconSize: [54, 54],
        iconAnchor: [27, 27],
      });
      const marker = L.marker([spot.lat, spot.lng], { icon });
      marker.addTo(map);
      marker.on("click", () => {
        // optional: open dialog/CTA
        // setSelectedTribeSpot(spot); setIsTribeSpotDialogOpen(true);
      });
      fresh.push(marker);
    });

    tribeMarkersRef.current = fresh;

    return () => {
      fresh.forEach((mk) => {
        try {
          map?.removeLayer(mk);
        } catch {}
      });
    };
  }, [map, selectedCity]);

  // --- Event markers layer ---
  useEffect(() => {
    // cleanup previous
    eventMarkers.forEach((mk) => {
      try {
        map?.removeLayer(mk);
      } catch {}
    });
    setEventMarkers([]);

    if (!map) return;

    const fresh: L.Marker[] = [];
    filteredEvents.forEach((e) => {
      const lat = e.lat;
      const lng = e.lng;
      if (typeof lat !== "number" || isNaN(lat) || typeof lng !== "number" || isNaN(lng)) return;

      const size = 56;
      const icon = L.divIcon({
        className: "tribe-event-icon",
        html: `
          <div class="tribe-event-card">
            <img src="${e.image_url || fallbackImg}" onerror="this.src='${fallbackImg}'" class="tribe-event-img"/>
            <div class="tribe-event-title">${e.title}</div>
            <div class="tribe-event-meta">
              <svg width="11" height="11" viewBox="0 0 24 24"><path fill="currentColor" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2c-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              ${(e.likes || 0) + (e.rsvp_yes || 0) + (e.rsvp_maybe || 0)}
            </div>
          </div>
        `,
        iconSize: [size, size + 20],
        iconAnchor: [size / 2, size + 20],
      });

      const marker = L.marker([lat, lng], { icon });
      marker.addTo(map);
      marker.on("click", async () => {
        const eid = e.id ?? `${e.title}-${e.date}-${e.time}`;
        setSelectedEventId(eid);
        setIsPanelOpen(true);
        setPanelHeight("partial");
        // Inline im AI-Fenster anzeigen:
        await fetchAndShowEventDescription(e);
      });
      fresh.push(marker);
    });

    setEventMarkers(fresh);

    return () => {
      fresh.forEach((mk) => {
        try {
          map?.removeLayer(mk);
        } catch {}
      });
    };
  }, [map, filteredEvents]);

  // --- User markers (optionales Feature: nur live+status) ---
  useEffect(() => {
    // In diesem Snippet weglassen oder minimal halten
    // -> falls du User-Overlays nutzt, kannst du hier deine Logik reaktivieren
    userMarkers.forEach((mk) => {
      try {
        map?.removeLayer(mk);
      } catch {}
    });
    setUserMarkers([]);
  }, [map]);

  // --- AI: fetch event description via Edge Function ---
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
      const html = renderEventHtml(evt, "Keine Beschreibung verfügbar. Versuche es später erneut.");
      handleAiResponseReceived(html, ["Was läuft heute?", "Events am Wochenende"]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  // --- Global handler für event:// Links im AI-HTML ---
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = (target.closest && target.closest("a")) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("event://")) return;
      e.preventDefault();

      if (href.startsWith("event://similar?")) {
        const params = new URLSearchParams(href.split("?")[1] || "");
        const cat = params.get("cat") || "";
        aiChatExternalSendHandler?.(`Zeig mir ${cat} Events`);
        return;
      }
      if (href.startsWith("event://save/")) {
        // Optional: Favoritenlogik
        return;
      }

      const eventId = href.slice("event://".length);
      const evt = filteredEvents.find((ev) => (ev.id || `${ev.title}-${ev.date}-${ev.time}`) === eventId);
      if (evt) fetchAndShowEventDescription(evt);
    };

    document.addEventListener("click", handler, true);
    document.addEventListener("touchend", handler as EventListener, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("touchend", handler as EventListener, true);
    };
  }, [filteredEvents, aiChatExternalSendHandler]);

  // --- Panel helpers ---
  const togglePanelHeight = () => {
    if (!isPanelOpen) {
      setIsPanelOpen(true);
      setPanelHeight("partial");
      return;
    }
    setPanelHeight((p) => (p === "partial" ? "full" : p === "full" ? "collapsed" : "partial"));
    if (panelHeight === "collapsed") setIsPanelOpen(false);
  };
  const closePanelCompletely = () => {
    setPanelHeight("collapsed");
    setIsPanelOpen(false);
  };

  // --- UI ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl mb-2">Lade Events…</h2>
          <p className="text-gray-400">Heutige Events werden geladen…</p>
        </div>
      </div>
    );
  }

  const totalToday = selectedDateFilteredEvents.length;

  return (
    <div className="relative w-full h-full" style={{ height: "100dvh" }}>
      {/* Header (mit Chat Input, MIa Badge, Filter Toggle, etc.) */}
      <HeatmapHeader
        selectedCity={selectedCity}
        chatInputProps={{
          input: "",
          setInput: () => {},
          handleSendMessage: (msg?: string) => aiChatExternalSendHandler?.(msg || "Was läuft heute?"),
          isTyping: chatLogic.isTyping,
          onKeyDown: chatLogic.handleKeyPress,
          onChange: chatLogic.handleInputChange,
          isHeartActive: chatLogic.isHeartActive,
          handleHeartClick: chatLogic.handleHeartClick,
          globalQueries: chatLogic.globalQueries,
          toggleRecentQueries: chatLogic.toggleRecentQueries,
          inputRef: chatLogic.inputRef,
          onAddEvent: () => setIsEventFormOpen(true),
          showAnimatedPrompts: true,
          activeChatModeValue: "ai",
        }}
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((v) => !v)}
        onOpenSwipeMode={() => {}}
        onMIAOpenChange={setIsMIAOpen}
        hasNewDailyRecommendation={hasNewDailyRecommendation}
        onMIAClick={async () => {
          if (!hasNewDailyRecommendation) return;
          setIsDailyRecommendationLoading(true);
          try {
            const { data } = await supabase.functions.invoke("generate-perfect-day", {
              body: {
                username: currentUser || "Gast",
                weather: "partly_cloudy",
                interests: userProfile?.interests || [],
                favorite_locations: userProfile?.favorite_locations || [],
              },
            });
            if (data?.response) {
              handleAiResponseReceived(data.response, ["Events am Wochenende", "Kreative Events"]);
              localStorage.setItem("last_daily_recommendation_date", new Date().toISOString().split("T")[0]);
              setHasNewDailyRecommendation(false);
            }
          } finally {
            setIsDailyRecommendationLoading(false);
          }
        }}
        isDailyRecommendationLoading={isDailyRecommendationLoading}
      />

      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <div ref={mapRef} className="w-full h-full relative" />

        {/* Subtle orange tint on tiles (nicht blockierend) */}
        <div className="pointer-events-none absolute inset-0 z-10 mix-blend-screen opacity-10 bg-[linear-gradient(0deg,rgba(255,120,40,0.5),rgba(255,120,40,0.5))]" />

        {/* Vignette statt Black Overlay */}
        <div className="pointer-events-none absolute inset-0 z-20 vignette-mask" />
      </div>

      {/* FILTER PANEL */}
      {showFilterPanel && !isMIAOpen && (
        <div className="fixed top-56 left-4 z-[1003] space-y-3 max-w-sm animate-in fade-in-50">
          <Card className="p-4 bg-black/90 backdrop-blur-md border-gray-700 shadow-xl">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <FilterIcon className="w-5 h-5 text-orange-500" />
              Filter – {format(selectedDate, "dd.MM.yyyy")}
            </h3>

            {/* Date Picker */}
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, "dd.MM.yyyy")}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800 z-[9999]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {(["alle", "ausgehen", "sport", "kreativität"] as FilterGroup[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm border",
                    selectedCategory === cat
                      ? "bg-orange-500/20 border-orange-500 text-orange-300"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700",
                  ].join(" ")}
                >
                  {cat[0].toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Time Slider */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Uhrzeit ab</span>
                <span>{String(timeRange[0]).padStart(2, "0")}:00</span>
              </div>
              <Slider value={timeRange} min={0} max={23} step={1} onValueChange={(v) => setTimeRange(v as number[])} />
            </div>

            {/* Meta */}
            <div className="mt-4 text-xs text-gray-400">
              {filteredEvents.length} von {totalToday} Events sichtbar
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
                onClick={() => {
                  setSelectedCategory("alle");
                  setTimeRange([0]);
                }}
              >
                <FilterX className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setShowFilterPanel(false)}
              >
                Schließen
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* BOTTOM PANEL TOGGLE */}
      <div className="fixed bottom-4 left-0 right-0 z-[1002] flex justify-center">
        <Button
          onClick={togglePanelHeight}
          className="bg-black/80 hover:bg-black text-gray-200 border border-gray-700 backdrop-blur px-4"
        >
          {panelHeight === "full" ? (
            <>
              <ChevronDown className="w-4 h-4 mr-2" /> Weniger
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4 mr-2" /> Mehr
            </>
          )}
        </Button>
      </div>

      {/* AI / MIA RIGHT PANE (simplifiziert) */}
      {isMIAOpen && (
        <div className="fixed top-[72px] right-4 bottom-4 w-[420px] z-[1004]">
          <Card className="w-full h-full bg-black/90 border border-gray-800 backdrop-blur-md overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-300">MIA – Event Assistent</div>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setIsMIAOpen(false);
                  setAiResponse(null);
                }}
                aria-label="close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isAiChatLoading ? (
                <div className="text-gray-400 text-sm">Lädt…</div>
              ) : aiResponse ? (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiResponse }} />
              ) : (
                <div className="text-gray-500 text-sm">Frag mich nach Events heute…</div>
              )}
            </div>
            {aiSuggestions.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {aiSuggestions.map((s, i) => (
                  <button key={i} className="ai-chip" onClick={() => aiChatExternalSendHandler?.(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* EVENT-FORM MODAL */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="bg-black/95 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Event hinzufügen</DialogTitle>
          </DialogHeader>
          <EventForm
            onSubmit={async (evtData) => {
              const cityObj = cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase());
              await addUserEvent({ ...evtData, city: cityObj?.name || selectedCity });
              await refreshEvents();
              setIsEventFormOpen(false);
            }}
            onCancel={() => setIsEventFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* BLOCK LOCATION DIALOG */}
      <AlertDialog open={isBlockLocationDialogOpen} onOpenChange={setIsBlockLocationDialogOpen}>
        <AlertDialogContent className="bg-black/95 border border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Location blockieren?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Möchtest du alle zukünftigen Events von „{locationToBlock}“ ausblenden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-200">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (locationToBlock) {
                  dislikeService.blockLocation(locationToBlock);
                  setDislikedEventIds((prev) => [...prev]); // trigger rerender
                }
                setIsBlockLocationDialogOpen(false);
                setLocationToBlock(null);
              }}
            >
              Blockieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GLOBAL STYLES for map tint / vignette / chips / markers */}
      <style jsx global>{`
        /* Leaflet container must sit above bg layers */
        .leaflet-container {
          background: transparent !important;
        }

        /* Tile tint: dezente Orange-Screen ohne Karte abzudunkeln */
        .tribe-tiles {
          filter: none !important; /* keine harte Filter hier */
          opacity: 1 !important;
        }

        /* Vignette: dunkelt nur die Ränder leicht ab, blockiert nicht die Karte */
        .vignette-mask {
          background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.35) 100%);
        }

        /* AI Chips */
        .ai-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 9999px;
          background: rgba(255, 120, 40, 0.12);
          border: 1px solid rgba(255, 120, 40, 0.35);
          color: #ffb48a;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ai-chip:hover {
          background: rgba(255, 120, 40, 0.2);
          color: #ffd6c2;
          border-color: rgba(255, 120, 40, 0.6);
        }

        /* Tribe spot marker */
        .tribe-spot-badge {
          background: #000;
          color: #fff;
          border-radius: 50%;
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ff651a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tribe-spot-badge:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(255, 101, 26, 0.25);
        }
        .tribe-spot-name {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.1;
          padding: 0 6px;
        }

        /* Event card marker */
        .tribe-event-card {
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          border-radius: 10px;
          width: 56px;
          height: 74px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 5px 6px;
          border: 1px solid #ff651a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
            'Noto Sans', 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
          overflow: hidden;
          backdrop-filter: blur(2px);
        }
        .tribe-event-img {
          width: 36px;
          height: 36px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 4px;
          display: block;
        }
        .tribe-event-title {
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: center;
          letter-spacing: 0.2px;
        }
        .tribe-event-meta {
          font-size: 10px;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffb08a;
        }
        .tribe-event-meta svg {
          margin-right: 2px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default EventHeatmap;
