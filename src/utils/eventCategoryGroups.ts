
export type CategoryGroup = 'Ausgehen' | 'Kreativität' | 'Sport';

const AUSGEHEN = new Set([
  'Party',
  'Konzert',
  'Festival',
  'Club',
  'Nightlife',
  'Bar',
]);

const KREATIVITAET = new Set([
  'Workshop',
  'Ausstellung',
  'Theater',
  'Lesung',
  'Kultur',
  'Kreativ',
  'Improtheater',
  'Impro',
  'Improvisation',
  'Comedy',
  'Kabarett',
  'VHS',
  'Volkshochschule',
  'Creative',
  'Kunst',
  'Art',
  'Krakeln',
  'Malen',
  'Zeichnen',
]);

const SPORT = new Set([
  'Sport',
  'Fitness',
  'Yoga',
  'Run',
  'Lauf',
]);

export const getCategoryGroup = (category?: string | null): CategoryGroup | null => {
  if (!category) return null;
  if (AUSGEHEN.has(category)) return 'Ausgehen';
  if (KREATIVITAET.has(category)) return 'Kreativität';
  if (SPORT.has(category)) return 'Sport';
  return null;
};

export const isInGroup = (category: string | undefined, group: CategoryGroup): boolean => {
  if (!category) return false;
  
  // Special case: "ausgehen" shows all events EXCEPT sport events
  if (group === 'Ausgehen') {
    return !SPORT.has(category);
  }
  
  const mapped = getCategoryGroup(category);
  return mapped === group;
};
