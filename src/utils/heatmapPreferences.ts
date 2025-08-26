// Heatmap preferences utilities for localStorage
const HEATMAP_PREFERENCES_KEY = 'eventHeatmap_preferences';

export interface HeatmapPreferences {
  selectedCategory: string;
  lastActivity: number;
}

const DEFAULT_PREFERENCES: HeatmapPreferences = {
  selectedCategory: 'alle',
  lastActivity: Date.now()
};

export const getHeatmapPreferences = (): HeatmapPreferences => {
  try {
    const stored = localStorage.getItem(HEATMAP_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Error loading heatmap preferences:', error);
  }
  return DEFAULT_PREFERENCES;
};

export const saveHeatmapPreferences = (preferences: Partial<HeatmapPreferences>) => {
  try {
    const current = getHeatmapPreferences();
    const updated = {
      ...current,
      ...preferences,
      lastActivity: Date.now()
    };
    localStorage.setItem(HEATMAP_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving heatmap preferences:', error);
  }
};

export const saveSelectedCategory = (category: string) => {
  saveHeatmapPreferences({ selectedCategory: category });
};

export const getSelectedCategory = (): string => {
  return getHeatmapPreferences().selectedCategory;
};