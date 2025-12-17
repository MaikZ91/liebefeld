// Sport-specific placeholder images for Hochschulsport events
const SPORT_IMAGES: Record<string, string> = {
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
  fußball: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
  fussball: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
  soccer: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop',
  schwimmen: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  krafttraining: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  laufen: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
  joggen: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
  tanzen: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop',
  dance: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop',
  hockey: 'https://images.unsplash.com/photo-1580748142189-df2dbda8fcd3?w=400&h=300&fit=crop',
  handball: 'https://images.unsplash.com/photo-1611251135345-18c56206b863?w=400&h=300&fit=crop',
  tischtennis: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=400&h=300&fit=crop',
  tabletennis: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=400&h=300&fit=crop',
  klettern: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&h=300&fit=crop',
  climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&h=300&fit=crop',
  bouldern: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&h=300&fit=crop',
  boxen: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop',
  kampfsport: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=300&fit=crop',
  martial: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=300&fit=crop',
  judo: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=300&fit=crop',
  karate: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=300&fit=crop',
  radfahren: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop',
  cycling: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop',
  spinning: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
  aerobic: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
  zumba: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=400&h=300&fit=crop',
  squash: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop',
  rudern: 'https://images.unsplash.com/photo-1594623274890-6b45ce7cf44a?w=400&h=300&fit=crop',
  rowing: 'https://images.unsplash.com/photo-1594623274890-6b45ce7cf44a?w=400&h=300&fit=crop',
  segeln: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  sailing: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop',
  fechten: 'https://images.unsplash.com/photo-1544298621-77b76a5c21fc?w=400&h=300&fit=crop',
  fencing: 'https://images.unsplash.com/photo-1544298621-77b76a5c21fc?w=400&h=300&fit=crop',
  turnen: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&h=300&fit=crop',
  gymnastics: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&h=300&fit=crop',
  leichtathletik: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
  athletics: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
};

// Default sport image for unknown sports
const DEFAULT_SPORT_IMAGE = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop';

/**
 * Check if an event is a Hochschulsport event
 */
export const isHochschulsportEvent = (title?: string, organizer?: string): boolean => {
  if (!title && !organizer) return false;
  const combined = `${title || ''} ${organizer || ''}`.toLowerCase();
  return combined.includes('hochschulsport') || 
         combined.includes('unisport') || 
         combined.includes('uni-sport') ||
         combined.includes('university sport');
};

/**
 * Get an appropriate image for a sport event based on keywords in the title
 */
export const getSportImage = (title?: string): string => {
  if (!title) return DEFAULT_SPORT_IMAGE;
  
  const lowerTitle = title.toLowerCase();
  
  // Check each sport keyword
  for (const [sport, imageUrl] of Object.entries(SPORT_IMAGES)) {
    if (lowerTitle.includes(sport)) {
      return imageUrl;
    }
  }
  
  return DEFAULT_SPORT_IMAGE;
};

/**
 * Get display image for an event - returns sport-specific image for Hochschulsport events
 */
export const getEventDisplayImage = (
  imageUrl?: string | null,
  title?: string,
  organizer?: string
): string | undefined => {
  // If event has a real image that's not a placeholder, use it
  if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('default')) {
    // For Hochschulsport events, always use sport-specific images
    if (isHochschulsportEvent(title, organizer)) {
      return getSportImage(title);
    }
    return imageUrl;
  }
  
  // For Hochschulsport events without images, get sport-specific image
  if (isHochschulsportEvent(title, organizer)) {
    return getSportImage(title);
  }
  
  return imageUrl || undefined;
};
