

# Korrektur aller Geocoding-Koordinaten mit verifizierten OpenStreetMap-Daten

## Problem
Die bisherigen Koordinaten in `HARDCODED_COORDINATES` waren von der KI generiert und teilweise komplett falsch. Zum Beispiel wurde Stereo Bielefeld auf die Feilenstrasse gesetzt, obwohl es am Ostwestfalen-Platz 3 liegt.

## Verifizierte Koordinaten (Quelle: OpenStreetMap/Nominatim)

| Location | Echte Adresse | Korrekt (lat, lng) | Bisher im Code |
|---|---|---|---|
| Stereo Bielefeld | Ostwestfalen-Platz 3 | 52.02998, 8.53112 | 52.0198, 8.5268 |
| Forum | Meller Str. 2 | 52.03082, 8.52991 | 52.0268, 8.5405 |
| Ringlokschuppen | Stadtheider Str. | 52.03720, 8.55226 | 52.0295, 8.5595 |
| Bunker Ulmenwall | Kreuzstr. 0 | 52.01617, 8.53192 | 52.0235, 8.5375 |
| Platzhirsch | Boulevard 1 | 52.03001, 8.53131 | 52.0212, 8.5335 |
| NR.Z.P | Grosse-Kurfuersten-Str. 81 | 52.02739, 8.52865 | 52.027554, 8.528664 |
| Cafe Europa | Jahnplatz 4 | 52.02325, 8.53396 | 52.022940, 8.532826 |
| Movie | Am Bahnhof 6 | 52.02812, 8.53281 | 52.0198, 8.5268 |
| Irish Pub | Mauerstr. 38 | 52.02190, 8.52852 | 52.0217, 8.5332 |
| Cutie | Grosse-Kurfuersten-Str. 81 | 52.02747, 8.52869 | 52.027474, 8.528685 |
| Cantine | Bleichstr. 77a | 52.02437, 8.55026 | 52.024371, 8.550264 |
| Stadttheater | Niederwall 27 | 52.02076, 8.53527 | 52.0228, 8.5295 |
| SchuecoArena | Melanchthonstr. 31a | 52.03203, 8.51678 | 52.031389, 8.516944 |

## Aenderung

Nur eine Datei wird geaendert: `src/services/geocodingService.ts`

Alle Eintraege in `HARDCODED_COORDINATES` werden mit den verifizierten OpenStreetMap-Koordinaten aktualisiert. Die groessten Korrekturen betreffen:

- **Stereo**: War komplett falsch (Feilenstrasse statt Ostwestfalen-Platz) -- Abweichung ca. 1km
- **Forum**: War falsch (Herforder Str. statt Meller Str.) -- Abweichung ca. 1km
- **Bunker Ulmenwall**: War deutlich verschoben -- Abweichung ca. 800m
- **Platzhirsch**: War deutlich verschoben -- Abweichung ca. 1km
- **Movie**: Hatte dieselben falschen Koordinaten wie Stereo -- Abweichung ca. 1km
- **Irish Pub**: War an falscher Stelle -- Abweichung ca. 500m
- **Stadttheater**: War verschoben -- Abweichung ca. 500m

Einige Locations waren schon fast korrekt (NR.Z.P, Cutie, Cantine, SchuecoArena, Cafe Europa) und bekommen nur minimale Feinkorrekturen.

Zusaetzlich werden auch die falschen Eintraege in der `location_coordinates`-Datenbanktabelle automatisch ueberschrieben, da die `batchGeocodeWithCache`-Funktion bei Hardcoded-Treffern die DB aktualisiert.

