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

  // --- HARDCODED MAPPING für Hochschulsport Bielefeld ---
  if (location.toLowerCase() === 'hochschulsport_bielefeld' || location.toLowerCase() === 'universität bielefeld') {
    const uniBielefeldCoords = { lat: 52.0357, lng: 8.5042, display_name: 'Universität Bielefeld' };
    console.log(`[Geocoding] Hardcoded match for ${location}, returning University of Bielefeld coordinates.`);
    coordinateCache.set(cacheKey, uniBielefeldCoords);
    await cacheCoordinatesInDB(location, city, uniBielefeldCoords);
    return uniBielefeldCoords;
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