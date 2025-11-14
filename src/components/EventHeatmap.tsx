// EventHeatmap.tsx — Berlin Style Edition (mit MIA KI)
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Filter, CalendarIcon, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEvents } from "@/hooks/useEvents";
import { useEventContext } from "@/contexts/EventContext";
import { useUserProfile } from "@/hooks/chat/useUserProfile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FullPageChatBot from "@/components/event-chat/FullPageChatBot";
import { useChatLogic } from "@/components/event-chat/useChatLogic";
import { cn } from "@/lib/utils";

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- Neue Komponente: BerlinHeader ---
const BerlinHeader: React.FC<{
  selectedCity: string;
  userProfile?: any;
  onSearchClick?: () => void;
}> = ({ selectedCity, userProfile, onSearchClick }) => {
  return (
    <header className="w-full bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between z-[1000]">
      <div className="flex items-center gap-3">
        <div className="font-bold text-white text-lg tracking-tight">
          Tonight in <span className="text-red-500 capitalize">{selectedCity}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSearchClick}
          className="text-xs bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1"
        >
          Alle Events
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 text-white">
          <Filter className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/10 hover:bg-white/20 text-white relative"
          onClick={() => window.dispatchEvent(new Event("toggle-mia-chat"))}
        >
          <Sparkles className="w-4 h-4 text-red-400" />
          <span className="absolute -bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </Button>

        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
          <img
            src={
              userProfile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.username || "User"}`
            }
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

// --- Hauptkomponente ---
const EventHeatmap: React.FC = () => {
  const { selectedCity } = useEventContext();
  const { userProfile } = useUserProfile();
  const { events, isLoading } = useEvents(selectedCity);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isMIAOpen, setIsMIAOpen] = useState(false);

  const chatLogic = useChatLogic(false, "ai");

  // --- Karte initialisieren ---
  useEffect(() => {
    if (!mapRef.current) return;
    if (map) {
      try {
        map.remove();
      } catch {}
    }

    const leafletMap = L.map(mapRef.current, {
      center: [52.52, 13.405],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => leafletMap.remove();
  }, [selectedCity]);

  // --- Eventlistener für MIA Chat ---
  useEffect(() => {
    const openMIA = () => setIsMIAOpen(true);
    window.addEventListener("toggle-mia-chat", openMIA);
    return () => window.removeEventListener("toggle-mia-chat", openMIA);
  }, []);

  // --- Loading State ---
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-pulse">Lade Events...</div>
      </div>
    );

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Header */}
      <BerlinHeader
        selectedCity={selectedCity}
        userProfile={userProfile}
        onSearchClick={() => toast({ title: "Eventliste", description: "Eventliste öffnen" })}
      />

      {/* Karte */}
      <div
        ref={mapRef}
        className="absolute inset-0 z-0"
        style={{
          height: "100vh",
          filter: "sepia(100%) saturate(400%) hue-rotate(355deg) brightness(0.7) contrast(1.6)",
        }}
      />

      {/* MIA Chat */}
      <Dialog open={isMIAOpen} onOpenChange={setIsMIAOpen}>
        <DialogContent className="z-[9999] bg-black/90 backdrop-blur-lg border border-white/10 text-white max-w-md w-[90vw] rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <Sparkles className="text-red-400 w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">MIA</h2>
                <p className="text-xs text-white/60">Deine Event-Assistentin</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMIAOpen(false)}
              className="rounded-full text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <FullPageChatBot
            chatLogic={chatLogic}
            activeChatModeValue="ai"
            communityGroupId=""
            hideInput={false}
            embedded={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventHeatmap;
