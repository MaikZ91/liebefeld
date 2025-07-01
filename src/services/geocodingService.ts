// src/services/geocodingService.ts
import { supabase } from "@/integrations/supabase/client";

interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  display_name?: string;
}

// Cache für bereits aufgelöste Koordinaten
const coordinateCache = new Map<string, GeocodeResult>();

// Speichere geocodierte Koordinaten für Wiederverwendung
const cacheCoordinatesInDB = async (location: string, city: string, coordinates: GeocodeResult) => {
  try {
    // Use type assertion to work with the new table
    const { error } = await (supabase as any)
      .from('location_coordinates')
      .upsert({
        location: location.toLowerCase(),
        city: city.toLowerCase(),
        lat: coordinates.lat,
        lng: coordinates.lng,
        display_name: coordinates.display_name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'location,city'
      });

    if (error) {
      console.warn('[Geocoding] Could not cache coordinates in DB:', error);
    }
  } catch (error) {
    console.warn('[Geocoding] Could not cache coordinates in DB:', error);
  }
};

// Lade gecachte Koordinaten aus der Datenbank
export const loadCachedCoordinates = async (): Promise<void> => {
  try {
    // Use type assertion to work with the new table
    const { data, error } = await (supabase as any)
      .from('location_coordinates')
      .select('*');
    
    if (error) {
      console.warn('[Geocoding] Could not load cached coordinates:', error);
      return;
    }
    
    if (data) {
      data.forEach((coord: any) => {
        const cacheKey = `${coord.location}_${coord.city}`;
        coordinateCache.set(cacheKey, {
          lat: coord.lat,
          lng: coord.lng,
          display_name: coord.display_name
        });
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
  if (cityCoordinates[cityKey]) {
    return cityCoordinates[cityKey];
  }
  
  // Default fallback to Bielefeld
  console.warn(`[Geocoding] No fallback coordinates for city: ${city}, using Bielefeld`);
  return cityCoordinates['bielefeld'];
};

// Batch-Geocoding für mehrere Events
export const geocodeMultipleLocations = async (
  locations: Array<{ location: string; city?: string }>
): Promise<Map<string, GeocodeResult>> => {
  const results = new Map<string, GeocodeResult>();
  
  // Verarbeite in kleineren Batches um Rate Limits zu vermeiden
  const batchSize = 5;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ({ location, city = 'Bielefeld' }) => {
      const key = `${location}_${city}`;
      const coordinates = await geocodeLocation(location, city);
      results.set(key, coordinates);
      
      // Kurze Pause zwischen Anfragen um Rate Limits zu respektieren
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
};


export const geocodeLocation = async (location: string, city: string = 'Bielefeld'): Promise<GeocodeResult> => {
  const cacheKey = `${location}_${city}`.toLowerCase();
  
  // Prüfe Cache zuerst
  if (coordinateCache.has(cacheKey)) {
    return coordinateCache.get(cacheKey)!;
  }

  // --- HARDCODED MAPPINGS für spezifische Orte ---
  const lowerCaseLocation = location.toLowerCase();
  let hardcodedResult: GeocodeResult | null = null;

  switch (lowerCaseLocation) {
    case 'hochschulsport_bielefeld':
    case 'universität bielefeld':
      hardcodedResult = { lat: 52.0357, lng: 8.5042, display_name: 'Universität Bielefeld' };
      break;
    case 'forum bielefeld':
      hardcodedResult = { lat: 52.0163, lng: 8.5298, display_name: 'Forum Bielefeld' };
      break;
    case 'nrzp':
    case 'kulturzentrum nummer zu platz':
      hardcodedResult = { lat: 52.027554, lng: 8.528664, display_name: 'NRZP' };
      break;
    case 'bunker ulmenwall':
      hardcodedResult = { lat: 52.016027, lng: 8.531694, display_name: 'Bunker Ulmenwall' };
      break;
    case 'sams':
    case 'club sams':
      hardcodedResult = { lat: 52.021111, lng: 8.534722, display_name: 'Club Sam\'s' };
      break;
    case 'movie bielefeld':
    case 'movie':
      hardcodedResult = { lat: 52.021305, lng: 8.532611, display_name: 'Movie Bielefeld' };
      break;
    case 'platzhirsch':
    case 'platzhirsch bielefeld':
      hardcodedResult = { lat: 52.021111, lng: 8.534722, display_name: 'Platzhirsch Bielefeld' }; // Approximate, same as Sams
      break;
    case 'irish pub':
    case 'irish pub bielefeld':
      hardcodedResult = { lat: 52.0217, lng: 8.5332, display_name: 'Irish Pub Bielefeld' }; // Approximate
      break;
    case 'stereo bielefeld':
    case 'stereo':
      hardcodedResult = { lat: 52.0224, lng: 8.5330, display_name: 'Stereo Bielefeld' }; // Approximate
      break;
    case 'cafe europa':
    case 'cafe europa bielefeld':
      hardcodedResult = { lat: 52.022940, lng: 8.532826, display_name: 'Cafe Europa' };
      break;
    case 'arminia bielefeld':
    case 'schücoarena':
      hardcodedResult = { lat: 52.031389, lng: 8.516944, display_name: 'SchücoArena (Arminia Bielefeld)' };
      break;
    case 'cutie bielefeld':
    case 'cutie':
      hardcodedResult = { lat: 52.027474, lng: 8.528685, display_name: 'Cutie Bielefeld' };
      break;
  }

  if (hardcodedResult) {
    console.log(`[Geocoding] Hardcoded match for ${location}, returning ${hardcodedResult.display_name} coordinates.`);
    coordinateCache.set(cacheKey, hardcodedResult);
    await cacheCoordinatesInDB(location, city, hardcodedResult);
    return hardcodedResult;
  }

  // --- AUSSCHLIESSLICH KI-Geocoding-Funktion aufrufen (wenn nicht hartkodiert) ---
  try {
    console.log(`[Geocoding] Calling AI Edge function for "${location}" with city context "${city}"`);
    
    // Aufruf Ihrer bereitgestellten Edge Function
    const { data, error: aiError } = await supabase.functions.invoke('ai-geocode-location', {
      body: { locationString: location, cityContext: city }
    });

    if (aiError) {
      console.error('[Geocoding] AI Edge function invocation error:', aiError);
      // Wenn die KI-Funktion selbst einen Fehler wirft, fällt die Funktion direkt auf den letzten Fallback zurück
      return getCityFallbackCoordinates(city);
    }

    const aiResult: GeocodeResult = {
      lat: data?.lat || null,
      lng: data?.lng || null,
      display_name: location // KI liefert keinen Displaynamen, hier Originalstring verwenden
    };

    if (aiResult.lat !== null && aiResult.lng !== null) {
      console.log(`[Geocoding] AI successfully found coordinates for ${location}: ${aiResult.lat}, ${aiResult.lng}`);
      coordinateCache.set(cacheKey, aiResult);
      await cacheCoordinatesInDB(location, city, aiResult);
      return aiResult; // Erfolg, Ergebnis zurückgeben
    } else {
      console.warn(`[Geocoding] AI found no valid coordinates for: ${location}. Using city fallback.`);
      return getCityFallbackCoordinates(city); // KI konnte keine gültigen Koordinaten finden
    }

  } catch (aiCallException) {
    console.error(`[Geocoding] Exception during AI geocoding call for ${location}:`, aiCallException);
    return getCityFallbackCoordinates(city); // Unvorhergesehener Fehler beim KI-Aufruf
  }
};