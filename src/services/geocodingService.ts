// src/services/geocodingService.ts
import { supabase } from "@/integrations/supabase/client";

interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  display_name?: string;
}

// Cache für bereits aufgelöste Koordinaten
const coordinateCache = new Map<string, GeocodeResult>();

// === EXPORTED HARDCODED COORDINATES ===
export const HARDCODED_COORDINATES: Record<string, GeocodeResult> = {
  // Uni
  'hochschulsport_bielefeld': { lat: 52.0357, lng: 8.5042, display_name: 'Universität Bielefeld' },
  'universität bielefeld': { lat: 52.0357, lng: 8.5042, display_name: 'Universität Bielefeld' },
  // Forum Bielefeld – Meller Str. 2
  'forum': { lat: 52.03082, lng: 8.52991, display_name: 'Forum Bielefeld' },
  'forum bielefeld': { lat: 52.03082, lng: 8.52991, display_name: 'Forum Bielefeld' },
  'forum_bielefeld': { lat: 52.03082, lng: 8.52991, display_name: 'Forum Bielefeld' },
  // NR.Z.P – Große-Kurfürsten-Str. 81
  'nr.z.p': { lat: 52.02739, lng: 8.52865, display_name: 'NRZP' },
  'kulturzentrum nummer zu platz': { lat: 52.02739, lng: 8.52865, display_name: 'NRZP' },
  // Bunker Ulmenwall – Kreuzstraße 0
  'bunker ulmenwall': { lat: 52.01617, lng: 8.53192, display_name: 'Bunker Ulmenwall' },
  'bunkerulmenwall': { lat: 52.01617, lng: 8.53192, display_name: 'Bunker Ulmenwall' },
  // Ringlokschuppen – Stadtheider Str. 11
  'ringlokschuppen': { lat: 52.03720, lng: 8.55226, display_name: 'Ringlokschuppen Bielefeld' },
  'ringlokschuppen bielefeld': { lat: 52.03720, lng: 8.55226, display_name: 'Ringlokschuppen Bielefeld' },
  // Sams
  'sams': { lat: 52.0215, lng: 8.5330, display_name: "Club Sam's" },
  'club sams': { lat: 52.0215, lng: 8.5330, display_name: "Club Sam's" },
  // Movie – Am Bahnhof 6
  'movie bielefeld': { lat: 52.02812, lng: 8.53281, display_name: 'Movie Bielefeld' },
  'movie': { lat: 52.02812, lng: 8.53281, display_name: 'Movie Bielefeld' },
  // Platzhirsch – Boulevard 1
  'platzhirsch': { lat: 52.03001, lng: 8.53131, display_name: 'Platzhirsch Bielefeld' },
  'platzhirsch bielefeld': { lat: 52.03001, lng: 8.53131, display_name: 'Platzhirsch Bielefeld' },
  // Irish Pub – Mauerstr. 38
  'irish pub': { lat: 52.02190, lng: 8.52852, display_name: 'Irish Pub Bielefeld' },
  'irish pub bielefeld': { lat: 52.02190, lng: 8.52852, display_name: 'Irish Pub Bielefeld' },
  // Stereo Bielefeld – Ostwestfalen-Platz 3
  'stereo': { lat: 52.02998, lng: 8.53112, display_name: 'Stereo Bielefeld' },
  'stereo bielefeld': { lat: 52.02998, lng: 8.53112, display_name: 'Stereo Bielefeld' },
  'stereobielefeld': { lat: 52.02998, lng: 8.53112, display_name: 'Stereo Bielefeld' },
  // Cafe Europa – Jahnplatz 4
  'cafe europa': { lat: 52.02325, lng: 8.53396, display_name: 'Cafe Europa' },
  'café europa': { lat: 52.02325, lng: 8.53396, display_name: 'Cafe Europa' },
  'cafe_europa_bi': { lat: 52.02325, lng: 8.53396, display_name: 'Cafe Europa' },
  // Arminia / SchücoArena – Melanchthonstr. 31a
  'arminia bielefeld': { lat: 52.03203, lng: 8.51678, display_name: 'SchücoArena (Arminia Bielefeld)' },
  'schücoarena': { lat: 52.03203, lng: 8.51678, display_name: 'SchücoArena (Arminia Bielefeld)' },
  // Cutie – Große-Kurfürsten-Str. 81
  'cutiebielefeld': { lat: 52.02747, lng: 8.52869, display_name: 'Cutie Bielefeld' },
  'cutie': { lat: 52.02747, lng: 8.52869, display_name: 'Cutie Bielefeld' },
  // Cantine – Bleichstraße 77a
  'cantine': { lat: 52.02437, lng: 8.55026, display_name: 'Cantine Bielefeld' },
  // Lokschuppen – Stadtheider Str.
  'lokschuppen': { lat: 52.03720, lng: 8.55226, display_name: 'Lokschuppen Bielefeld' },
  // Stadttheater / Theater Bielefeld – Niederwall 27
  'theater bielefeld': { lat: 52.02076, lng: 8.53527, display_name: 'Theater Bielefeld' },
  'stadttheater': { lat: 52.02076, lng: 8.53527, display_name: 'Theater Bielefeld' },
  'stadttheater bielefeld': { lat: 52.02076, lng: 8.53527, display_name: 'Theater Bielefeld' },
};

// Speichere geocodierte Koordinaten für Wiederverwendung
const cacheCoordinatesInDB = async (location: string, city: string, coordinates: GeocodeResult) => {
  try {
    if (coordinates.lat === null || coordinates.lng === null) return;
    const { error } = await (supabase as any)
      .from('location_coordinates')
      .upsert({
        location: location.toLowerCase(),
        city: city.toLowerCase(),
        lat: coordinates.lat,
        lng: coordinates.lng,
        display_name: coordinates.display_name,
        updated_at: new Date().toISOString()
      }, { onConflict: 'location,city' });
    if (error) console.warn('[Geocoding] Could not cache coordinates in DB:', error);
  } catch (error) {
    console.warn('[Geocoding] Could not cache coordinates in DB:', error);
  }
};

// Lade gecachte Koordinaten aus der Datenbank
export const loadCachedCoordinates = async (): Promise<void> => {
  try {
    const { data, error } = await (supabase as any)
      .from('location_coordinates')
      .select('*');
    if (error) { console.warn('[Geocoding] Could not load cached coordinates:', error); return; }
    if (data) {
      data.forEach((coord: any) => {
        const cacheKey = `${coord.location}_${coord.city}`;
        coordinateCache.set(cacheKey, { lat: coord.lat, lng: coord.lng, display_name: coord.display_name });
      });
      console.log(`[Geocoding] Loaded ${data.length} cached coordinates`);
    }
  } catch (error) {
    console.warn('[Geocoding] Error loading cached coordinates:', error);
  }
};

// Fallback-Koordinaten für Städte
const getCityFallbackCoordinates = (city: string): GeocodeResult => {
  const cityCoordinates: { [key: string]: GeocodeResult } = {
    'bielefeld': { lat: 52.0302, lng: 8.5311 },
    'bi': { lat: 52.0302, lng: 8.5311 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'hamburg': { lat: 53.5511, lng: 9.9937 },
    'köln': { lat: 50.935173, lng: 6.953101 },
    'munich': { lat: 48.1351, lng: 11.5820 },
    'münchen': { lat: 48.1351, lng: 11.5820 },
    'münster': { lat: 51.9607, lng: 7.6261 },
    'paris': { lat: 48.8566, lng: 2.3522 }
  };
  const cityKey = city.toLowerCase();
  return cityCoordinates[cityKey] || cityCoordinates['bielefeld'];
};

// === BATCH GEOCODE WITH CACHE (new!) ===
// Used by TribeMapView to geocode all event locations efficiently
export const batchGeocodeWithCache = async (
  locations: string[],
  city: string
): Promise<Map<string, { lat: number; lng: number }>> => {
  const results = new Map<string, { lat: number; lng: number }>();
  const missing: string[] = [];

  // Step 1: Load DB cache into memory (if not already)
  await loadCachedCoordinatesForLocations(locations, city);

  for (const loc of locations) {
    const key = loc.toLowerCase();

    // Step 2a: Check hardcoded (highest priority, also updates DB cache)
    if (HARDCODED_COORDINATES[key]) {
      const hc = HARDCODED_COORDINATES[key];
      if (hc.lat !== null && hc.lng !== null) {
        results.set(key, { lat: hc.lat, lng: hc.lng });
        // Update DB cache in background so stale AI entries get corrected
        cacheCoordinatesInDB(loc, city, hc);
        continue;
      }
    }

    // Step 2b: Check in-memory cache (populated from DB)
    const cacheKey = `${key}_${city.toLowerCase()}`;
    const cached = coordinateCache.get(cacheKey);
    if (cached && cached.lat !== null && cached.lng !== null) {
      results.set(key, { lat: cached.lat, lng: cached.lng });
      continue;
    }

    // Step 2c: Unknown → needs AI
    missing.push(loc);
  }

  console.log(`[Geocoding] Batch: ${results.size} cached/hardcoded, ${missing.length} need AI`);

  // Step 3: Call AI only for missing locations
  if (missing.length > 0) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-batch-geocode', {
        body: { locations: missing, cityContext: city }
      });

      if (!error && data?.coordinates) {
        for (const c of data.coordinates) {
          if (c.lat && c.lng && c.location) {
            const locKey = c.location.toLowerCase();
            results.set(locKey, { lat: c.lat, lng: c.lng });
            // Cache in DB for next time
            await cacheCoordinatesInDB(c.location, city, { lat: c.lat, lng: c.lng, display_name: c.location });
          }
        }
      }
    } catch (err) {
      console.error('[Geocoding] AI batch geocode failed:', err);
    }
  }

  return results;
};

// Helper: load cached coordinates from DB for specific locations
const loadCachedCoordinatesForLocations = async (locations: string[], city: string): Promise<void> => {
  try {
    const lowerLocations = locations.map(l => l.toLowerCase());
    const { data, error } = await (supabase as any)
      .from('location_coordinates')
      .select('*')
      .eq('city', city.toLowerCase())
      .in('location', lowerLocations);
    if (error) return;
    if (data) {
      data.forEach((coord: any) => {
        const cacheKey = `${coord.location}_${coord.city}`;
        coordinateCache.set(cacheKey, { lat: coord.lat, lng: coord.lng, display_name: coord.display_name });
      });
    }
  } catch { /* ignore */ }
};

// Batch-Geocoding für mehrere Events
export const geocodeMultipleLocations = async (
  locations: Array<{ location: string; city?: string }>
): Promise<Map<string, GeocodeResult>> => {
  const results = new Map<string, GeocodeResult>();
  const batchSize = 5;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    const batchPromises = batch.map(async ({ location, city = 'Bielefeld' }) => {
      const key = `${location}_${city}`;
      const coordinates = await geocodeLocation(location, city);
      results.set(key, coordinates);
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    await Promise.all(batchPromises);
  }
  return results;
};

export const geocodeLocation = async (location: string, city: string = 'Bielefeld'): Promise<GeocodeResult> => {
  const cacheKey = `${location}_${city}`.toLowerCase();
  if (coordinateCache.has(cacheKey)) return coordinateCache.get(cacheKey)!;

  // Check hardcoded
  const lowerCaseLocation = location.toLowerCase();
  if (HARDCODED_COORDINATES[lowerCaseLocation]) {
    const result = HARDCODED_COORDINATES[lowerCaseLocation];
    coordinateCache.set(cacheKey, result);
    await cacheCoordinatesInDB(location, city, result);
    return result;
  }

  // AI geocoding
  try {
    console.log(`[Geocoding] Calling AI Edge function for "${location}" with city context "${city}"`);
    const { data, error: aiError } = await supabase.functions.invoke('ai-geocode-location', {
      body: { locationString: location, cityContext: city }
    });
    if (aiError) return getCityFallbackCoordinates(city);

    const aiResult: GeocodeResult = { lat: data?.lat || null, lng: data?.lng || null, display_name: location };
    if (aiResult.lat !== null && aiResult.lng !== null) {
      coordinateCache.set(cacheKey, aiResult);
      await cacheCoordinatesInDB(location, city, aiResult);
      return aiResult;
    }
    return getCityFallbackCoordinates(city);
  } catch {
    return getCityFallbackCoordinates(city);
  }
};
