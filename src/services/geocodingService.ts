
import { supabase } from "@/integrations/supabase/client";

interface GeocodeResult {
  lat: number;
  lng: number;
  display_name?: string;
}

// Cache für bereits aufgelöste Koordinaten
const coordinateCache = new Map<string, GeocodeResult>();

// Nominatim Geocoding Service (kostenlos, keine API-Key erforderlich)
export const geocodeLocation = async (location: string, city: string = 'Bielefeld'): Promise<GeocodeResult> => {
  const cacheKey = `${location}_${city}`.toLowerCase();
  
  // Prüfe Cache zuerst
  if (coordinateCache.has(cacheKey)) {
    return coordinateCache.get(cacheKey)!;
  }

  try {
    // Kombiniere Location mit Stadt für bessere Ergebnisse
    const searchQuery = `${location}, ${city}, Germany`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    console.log(`[Geocoding] Searching for: ${searchQuery}`);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&countrycodes=de`,
      {
        headers: {
          'User-Agent': 'Liebefeld-Event-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result: GeocodeResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
      
      console.log(`[Geocoding] Found coordinates for ${location}: ${result.lat}, ${result.lng}`);
      
      // Cache das Ergebnis
      coordinateCache.set(cacheKey, result);
      
      // Optional: Speichere in Datenbank für zukünftige Verwendung
      await cacheCoordinatesInDB(location, city, result);
      
      return result;
    } else {
      console.warn(`[Geocoding] No results found for: ${searchQuery}`);
      // Fallback auf Stadtzentrum
      return getCityFallbackCoordinates(city);
    }
  } catch (error) {
    console.error(`[Geocoding] Error geocoding ${location}:`, error);
    // Fallback auf Stadtzentrum
    return getCityFallbackCoordinates(city);
  }
};

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
