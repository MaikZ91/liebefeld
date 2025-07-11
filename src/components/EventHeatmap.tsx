/* -------------------------------------------------------------
   EventHeatmap.tsx  ·  korrigierte Minimal-Version
---------------------------------------------------------------- */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Button } from '@/components/ui/button';
import { Card }   from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/* ---------- lucide-react Icons -------------------------------- */
import {
  MapPin,
  Calendar as CalIcon,            //  ⬅ nur EIN Calendar-Icon
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
  /* kein CalendarIcon mehr – wir nutzen CalIcon oben */
} from 'lucide-react';

/* -------------------------------------------------------------- */

import { useEvents } from '@/hooks/useEvents';
import { format }    from 'date-fns';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent }           from '@/components/ui/calendar';

/* … alle weiteren Imports bleiben unverändert … */


/* ==============================================================
   EventHeatmap Component
================================================================= */

const EventHeatmap: React.FC = () => {
  /* ------------------------------------------------------------------
     State-Hooks & Context (gekürzt – alles wie bei dir)
  ------------------------------------------------------------------ */
  const { selectedCity } = useEventContext();
  const { events } = useEvents(selectedCity);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const [eventCoordinates, setEventCoordinates] =
    useState<Map<string, { lat: number; lng: number }>>(new Map());

  /* … Deine weiteren States bleiben … */


  /* --------------------------------------------------------------
     1️⃣  BATCH-GEOCODING   (Datum + Stadt gefiltert)
  --------------------------------------------------------------- */
  useEffect(() => {
    const geocodeEventLocations = async () => {
      if (!events.length) return;

      // -------- Event-Subset für Stadt + gewähltes Datum ----------
      const currentCityEvents = events.filter(ev => {
        const evCity = ev.city?.toLowerCase() || '';
        const sel    = selectedCity.toLowerCase();

        const cityOK = sel === 'bi' || sel === 'bielefeld'
          ? !evCity || evCity === 'bi' || evCity === 'bielefeld'
          : evCity === sel;

        const dateOK = ev.date === selectedDateString;
        return cityOK && dateOK && ev.location;
      });

      if (!currentCityEvents.length) return;

      // ---------- eindeutige Locations sammeln --------------------
      const locationPayload = Array.from(
        new Set(currentCityEvents.map(ev => ev.location!))
      ).map(loc => ({ location: loc, city: selectedCity }));

      try {
        const coords = await geocodeMultipleLocations(locationPayload);

        const mapped = new Map<string, { lat: number; lng: number }>();
        currentCityEvents.forEach(ev => {
          const key = `${ev.location}_${selectedCity}`;
          const c   = coords.get(key);
          if (c) mapped.set(ev.id, c);
        });

        setEventCoordinates(mapped);
        console.info('[Geocode] mapped', mapped.size, 'locations');
      } catch (err) {
        console.error('[Geocode] error:', err);
      }
    };

    geocodeEventLocations();
  }, [events, selectedCity, selectedDateString]);   //  ⬅ Datum als Dependency


  /* --------------------------------------------------------------
     … ab hier bleibt dein Original-Code unverändert …
  --------------------------------------------------------------- */

  /* --- UI-Render (gekürzt) ------------------------------------- */
  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* --- Filter Panel (Ausschnitt) ---------------------------- */}
      <PopoverTrigger asChild>
        <Button /* … */>
          <CalIcon className="h-4 w-4" /> {/*  ⬅  alias-Icon nutzen */}
          {format(selectedDate, 'dd.MM.yyyy')}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      {/* --- Rest deiner Komponente bleibt eins-zu-eins … -------- */}
    </div>
  );
};

export default EventHeatmap;
