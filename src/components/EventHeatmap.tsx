// src/components/EventHeatmap.tsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // ➜ NEW: heat‑layer support
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
  Eye,
  EyeOff, // ➜ NEW: Icons for Eco‑Heat toggle
} from 'lucide-react';
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

/* -------------------------------------------------------------------------
 * Eco‑Counter (Rad‑ & Fußverkehr) – Bielefeld WFS + Eco‑Visio public stats
 * ---------------------------------------------------------------------- */
const WFS_URL =
  'https://www.bielefeld01.de/mdOLKD/WFS/radverkehrszaehlstellen/02?service=WFS&version=2.0.0&request=GetFeature&typeNames=radverkehrszaehlstellen_p&outputFormat=application/json';

/**
 * Ruft 15‑Min‑Aggregat der Eco‑Visio‑Site‑IDs für den aktuellen Tag ab.
 * data_kind: "T" = Total (Rad + Fuß)
 */
async function fetchEcoCounts(ids: number[]) {
  const res = await fetch('https://www.eco-visio.net/v1/public/stats.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ids,
      start: 'today',
      end: 'today',
      step: '15min',
      data_kind: 'T',
    }),
  });
  if (!res.ok) throw new Error(`Eco‑Visio error ${res.status}`);
  return res.json(); // [{ id, total, ... }]
}

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EventHeatmap: React.FC = () => {
  /* ───────────────────────────────────────────────────────────
   * Existing hooks & state
   * ──────────────────────────────────────────────────────── */
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

  /* ───────────────────────────────────────────────────────────
   * NEW: Eco‑Counter heat‑layer state
   * ──────────────────────────────────────────────────────── */
  const [ecoHeat, setEcoHeat] = useState<L.HeatLayer | null>(null);
  const [showEcoHeat, setShowEcoHeat] = useState(true);

  // Initialize chat logic for AI chat
  const chatLogic = useChatLogic();

  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  // Load cached coordinates on component mount
  useEffect(() => {
    loadCachedCoordinates();
  }, []);

  /* -------------------------------------------------------------------
   * Eco‑Counter heat‑layer setup (creates L.heatLayer once)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!map || ecoHeat) return;

    const heat = (L as any).heatLayer([], { radius: 25, blur: 15 }).addTo(map);
    setEcoHeat(heat);
  }, [map, ecoHeat]);

  /* -------------------------------------------------------------------
   * Eco‑Counter live refresh every 60 s
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!map || !ecoHeat) return;

    let timer: NodeJS.Timeout;

    const refreshEcoHeat = async () => {
      try {
        const meta = await fetch(WFS_URL).then((r) => r.json());
        const feats = meta.features as any[];

        const ids: number[] = feats.map((f) =>
          Number((f.properties.url as string).match(/id=(\d+)/)![1])
        );

        const counts = await fetchEcoCounts(ids); // [{id,total},…]

        const pts: [number, number, number][] = feats.map((f) => {
          const id = Number((f.properties.url as string).match(/id=(\d+)/)![1]);
          const val = counts.find((c: any) => c.id === id)?.total ?? 0;
          const [lng, lat] = f.geometry.coordinates;
          return [lat, lng, val];
        });

        ecoHeat.setLatLngs(pts);
      } catch (err) {
        console.error('[Eco-Heat] Update failed', err);
      }
    };

    refreshEcoHeat();
    timer = setInterval(refreshEcoHeat, 60_000);
    return () => clearInterval(timer);
  }, [map, ecoHeat]);

  /* ───────────────────────────────────────────────────────────
   * Rest of your existing logic (geocoding, filtering, etc.)
   * ──────────────────────────────────────────────────────── */

  // Geocode all event locations when events change
  useEffect(() => {
    const geocodeEventLocations = async () => {
      if (!events.length) return;

      console.log('[EventHeatmap] Starting geocoding for events...');

      // Sammle alle einzigartigen Locations
      const uniqueLocations = new Set<string>();
      const locationData: Array<{ location: string; city?: string }> = [];

      events.forEach((event) => {
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
        // Batch-Geocoding für bessere Performance
        const coordinates = await geocodeMultipleLocations(locationData);

        // Erstelle neue Koordinaten-Map für Events
        const newEventCoordinates = new Map<string, { lat: number; lng: number }>();

        events.forEach((event) => {
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
        console.log(`[EventHeatmap] Geocoded ${newEventCoordinates.size} event locations`);
      } catch (error) {
        console.error('[EventHeatmap] Error during batch geocoding:', error);
      }
    };

    geocodeEventLocations();
  }, [events, selectedCity]);

  /* … (DIE RESTLICHEN EFFECTS + HELPER FUNKTIONEN
         bleiben UNVERÄNDERT und werden der Kürze halber nicht erneut
         aufgeführt – sie entsprechen deinem ursprünglichen File) … */

  /* -------------------------------------------------------------------
   * Button‑Handler zum Ein‑/Ausblenden der Eco‑Heatmap
   * ---------------------------------------------------------------- */
  const toggleEcoHeat = () => {
    setShowEcoHeat((prev) => {
      if (ecoHeat && map) {
        if (prev) ecoHeat.removeFrom(map);
        else ecoHeat.addTo(map);
      }
      return !prev;
    });
  };

  /* -------------------------------------------------------------------
   * JSX
   * ---------------------------------------------------------------- */
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

  /* … EXISTIERENDE BERECHNUNGEN (todaysFilteredEvents, categories, …) … */

  /* -------------------------------------------------------------------
   * RETURN
   * ---------------------------------------------------------------- */
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Live Ticker Header */}
      <HeatmapHeader selectedCity={selectedCity} />

      {/* Filter Toggle Button */}
      <div className="absolute top-16 left-4 z-[1001]">
        <Button
          variant="outline"
          size="icon"
          className="bg-black/95 text-white border-gray-700 hover:bg-gray-800"
          onClick={() => setShowFilterPanel((prev) => !prev)}
          title={showFilterPanel ? 'Filter ausblenden' : 'Filter anzeigen'}
        >
          {showFilterPanel ? <FilterX className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="absolute top-28 left-4 z-[1000] space-y-3 max-w-sm animate-fade-in">
          <Card className="p-4 bg-black/95 backdrop-blur-md border-gray-700 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Events heute in {cities.find((c) => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity}
            </h3>

            <div className="space-y-4">
              {/* Category Dropdown – unverändert */}

              {/* Time Slider – unverändert */}

              {/* Perfect Day Button – unverändert */}

              {/* AI Chat Button – unverändert */}

              {/* ➜ NEW: Eco‑Heatmap Toggle */}
              <Button
                onClick={toggleEcoHeat}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
              >
                {showEcoHeat ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {showEcoHeat ? 'Heatmap ausblenden' : 'Heatmap einblenden'}
              </Button>

              {/* AI Chat Input – unverändert (falls showAIChat) */}
            </div>
          </Card>

          {/* Stats Card – unverändert */}
        </div>
      )}

      {/* Restlicher JSX (Buttons, Map container, Panels, Dialoge, …) bleibt wie gehabt */}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '100vh', zIndex: 1 }}
      />

      {/* … ALLE ANDEREN BESTEHENDEN PANELS / DIALOGE … */}
    </div>
  );
};

export default EventHeatmap;
