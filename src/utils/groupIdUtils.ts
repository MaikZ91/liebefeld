// src/utils/groupIdUtils.ts
import { v5 as uuidv5 } from 'uuid';
import { cities } from '@/contexts/EventContext';

// Namespace UUID for THE TRIBE community groups (randomly generated, but consistent)
const TRIBE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Creates a deterministic, readable string for city-specific group IDs.
 * This ensures the same city-category combination always produces the same ID.
 * Example: Bielefeld + "ausgehen" -> "bielefeld_ausgehen"
 */
export const createCitySpecificGroupId = (category: string, cityCode: string): string => {
  // Resolve cityCode which may be an abbreviation (e.g., "BI") or a city name (e.g., "Bielefeld")
  const lower = (cityCode || '').toLowerCase();
  const match = cities.find(
    (c) => c.abbr.toLowerCase() === lower || c.name.toLowerCase() === lower
  );
  // Normalize to letters-only city slug, preferring the canonical city name when known
  const normalizedCity = (match ? match.name : cityCode)
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const normalizedCategory = category.toLowerCase();
  return `${normalizedCity}_${normalizedCategory}`;
};

/**
 * Creates a human-readable display name for the group
 */
export const createGroupDisplayName = (category: string, cityAbbr: string, cities: any[]): string => {
  const city = cities.find(c => c.abbr.toLowerCase() === cityAbbr.toLowerCase());
  const cityName = city ? city.name : cityAbbr.toUpperCase();
  const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
  
  return `${capitalizedCategory} • ${cityName}`;
};

/**
 * Extracts city and category from a legacy string-based group ID
 * Returns null if the ID is not in the expected format
 */
export const parseLegacyGroupId = (groupId: string): { city: string; category: string } | null => {
  const parts = groupId.split('_');
  if (parts.length === 2) {
    return { city: parts[0], category: parts[1] };
  }
  return null;
};
