
// src/utils/groupIdUtils.ts
import { v5 as uuidv5 } from 'uuid';

// Namespace UUID for THE TRIBE community groups (randomly generated, but consistent)
const TRIBE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Creates a deterministic UUID for city-specific group IDs
 * This ensures the same city-category combination always produces the same UUID
 */
export const createCitySpecificGroupId = (category: string, cityAbbr: string): string => {
  const normalizedCity = cityAbbr.toLowerCase();
  const normalizedCategory = category.toLowerCase();
  
  // Create a deterministic string identifier
  const stringIdentifier = `${normalizedCity}_${normalizedCategory}`;
  
  // Generate a deterministic UUID using UUID v5
  return uuidv5(stringIdentifier, TRIBE_NAMESPACE);
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
