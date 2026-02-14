
# Fix: Event-Geolocation auf der Map

## Problem
Die Map-Ansicht (`TribeMapView.tsx`) ruft bei **jedem Laden** die KI-basierte `ai-batch-geocode` Edge Function auf, um alle Event-Standorte zu geocodieren. Das hat zwei Probleme:
1. **Bereits korrekt gecachte Koordinaten** in der `location_coordinates`-Tabelle werden komplett ignoriert
2. **Hardcoded Mappings** aus `geocodingService.ts` (Forum, Stereo, Bunker Ulmenwall etc.) werden nicht genutzt
3. Die KI liefert bei jedem Aufruf potenziell **unterschiedliche/falsche Koordinaten**

## Loesung

### Schritt 1: Map nutzt gecachte Koordinaten zuerst
Die `TribeMapView.tsx` wird so umgebaut, dass sie:
1. Zuerst alle Koordinaten aus der `location_coordinates`-Tabelle laedt
2. Dann die hardcoded Mappings aus `geocodingService.ts` anwendet (diese haben Prioritaet)
3. Nur fuer **unbekannte Standorte** die KI-Batch-Funktion aufruft
4. Neue KI-Ergebnisse in die `location_coordinates`-Tabelle cached

### Schritt 2: Gemeinsame Geocoding-Logik
Statt dass die Map eine eigene Geocoding-Logik hat, wird der bestehende `geocodingService.ts` wiederverwendet. Konkret:
- Export der hardcoded Mappings als Konstante
- Neue Hilfsfunktion `getCoordinatesForLocations(locations, city)` die Cache-DB, Hardcoded und KI kombiniert

### Schritt 3: KI-Ergebnisse validieren und cachen
Wenn die KI neue Koordinaten liefert, werden diese in `location_coordinates` gespeichert, damit sie beim naechsten Mal sofort verfuegbar sind.

## Technische Details

### Aenderungen in `src/services/geocodingService.ts`
- Export der hardcoded Koordinaten-Map als `HARDCODED_COORDINATES`
- Neue Funktion `batchGeocodeWithCache(locations: string[], city: string)` die:
  1. `location_coordinates` Tabelle abfragt
  2. Hardcoded Mappings prueft
  3. Nur fehlende Locations an `ai-batch-geocode` sendet
  4. Ergebnisse cached

### Aenderungen in `src/components/tribe/TribeMapView.tsx`
- Batch-Geocoding useEffect ersetzt: statt direkt `ai-batch-geocode` aufzurufen, wird die neue `batchGeocodeWithCache` Funktion aus dem geocodingService verwendet
- Fallback auf `getJitteredCoords` nur wenn wirklich keine Koordinaten gefunden wurden

### Keine Aenderungen an Edge Functions
Die `ai-batch-geocode` und `ai-geocode-location` Functions bleiben unveraendert - sie werden nur seltener aufgerufen.

## Erwartetes Ergebnis
- Forum, Stereo und andere hardcoded Locations werden **sofort korrekt** angezeigt
- Bereits gecachte Locations aus der DB werden ohne KI-Aufruf geladen
- Nur wirklich neue/unbekannte Locations loesen einen KI-Aufruf aus
- Ergebnisse werden persistent gecacht fuer zukuenftige Aufrufe
