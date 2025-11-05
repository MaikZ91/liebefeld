// EventHeatmap.tsx
import React, { useEffect, useRef, useState } from "react";
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

// ==============================
// Hauptkomponente
// ==============================
export default function EventHeatmap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const selectedCity = "bielefeld";

  useEffect(() => {
    if (!mapRef.current) return;

    if (map) {
      map.remove();
      setMap(null);
    }

    const initializeMap = () => {
      if (!mapRef.current) return;

      // === Leaflet-Map erzeugen ===
      const leafletMap = L.map(mapRef.current, {
        center: [52.02, 8.53],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // === eigenes Pane für Labels ===
      leafletMap.createPane("labels");
      leafletMap.getPane("labels")!.style.zIndex = "650";
      leafletMap.getPane("labels")!.style.pointerEvents = "none";

      // === Basemap: CARTO Dark ohne Labels ===
      const base = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        className: "tribe-tiles tribe-black",
        zIndex: 200,
      }).addTo(leafletMap);

      // === Labels: Esri Reference Overlay ===
      const labels = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          pane: "labels",
          className: "tribe-tiles tribe-labels",
          zIndex: 650,
        },
      ).addTo(leafletMap);

      // === Beispielpunkte (Demo-Heat) ===
      const points = [
        [52.02, 8.53],
        [52.03, 8.52],
        [52.05, 8.55],
        [52.0, 8.5],
      ];
      points.forEach((p) =>
        L.circleMarker(p, {
          radius: 6,
          color: "orange",
          fillColor: "orange",
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(leafletMap),
      );

      setMap(leafletMap);
    };

    const timeoutId = setTimeout(initializeMap, 50);
    return () => clearTimeout(timeoutId);
  }, [mapRef.current, selectedCity]);

  return (
    <div className="relative w-full h-[100vh] bg-black overflow-hidden">
      <div ref={mapRef} id="map" className="absolute inset-0 z-0" />

      {/* Beispiel-UI-Elemente */}
      <div className="absolute top-4 left-4 z-[900]">
        <Card className="p-2 bg-black/70 text-white border border-orange-500 rounded-xl shadow-lg">
          <p className="font-bold text-lg">THE TRIBE – Bielefeld</p>
        </Card>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[900]">
        <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 py-3 shadow-md">
          Events anzeigen
        </Button>
      </div>

      <style>{`
        /* =======================
           MAP-STYLES
        ======================= */

        /* Basemap abdunkeln + orange-Tönung */
        .leaflet-tile-pane .tribe-black .leaflet-tile {
          filter:
            brightness(0.45)
            contrast(1.35)
            sepia(12%)
            saturate(170%)
            hue-rotate(330deg) !important;
          opacity: 0.98;
        }

        /* Labels klar und hell */
        .leaflet-tile-pane .tribe-labels .leaflet-tile {
          filter: grayscale(100%) brightness(1.15) contrast(1.10) !important;
          opacity: 0.9;
          mix-blend-mode: normal;
        }

        /* subtiler orange Glow über der Karte */
        .relative::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(120% 70% at 50% 25%, rgba(255,120,40,0.05), rgba(0,0,0,0) 60%);
          mix-blend-mode: screen;
        }
      `}</style>
    </div>
  );
}
