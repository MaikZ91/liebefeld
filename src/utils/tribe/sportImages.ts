// Event-specific placeholder images based on keywords
const EVENT_IMAGES: Record<string, string> = {
  // Sports
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
  lauftreff: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
  läufer: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
  teilzeit: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
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
  
  // Dance styles
  tango: 'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=400&h=300&fit=crop',
  argentina: 'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=400&h=300&fit=crop',
  salsa: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop',
  bachata: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop',
  tanzen: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop',
  dance: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop',
  ballett: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=300&fit=crop',
  ballet: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=300&fit=crop',
  hiphop: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop',
  
  // Theater & Culture
  improtheater: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
  impro: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
  improvisation: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
  theater: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=300&fit=crop',
  theatre: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=300&fit=crop',
  comedy: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&h=300&fit=crop',
  standup: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&h=300&fit=crop',
  kabarett: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&h=300&fit=crop',
  karaoke: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
  
  // Cinema
  cinemaxx: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
  kino: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
  cinema: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
  film: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
  
  // VHS / Education
  vhs: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
  volkshochschule: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
  kurs: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
  workshop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
  seminar: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
};

// Default image for unknown events
const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop';

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
 * Check if event location is a venue that should always use keyword images
 */
const isKeywordVenue = (location?: string): boolean => {
  if (!location) return false;
  const lower = location.toLowerCase();
  return lower.includes('cinemaxx') || 
         lower.includes('vhs') || 
         lower.includes('volkshochschule') ||
         lower.includes('hochschulsport');
};

/**
 * Get an appropriate image for an event based on keywords in title AND location
 */
export const getKeywordImage = (title?: string, location?: string): string | null => {
  const combined = `${title || ''} ${location || ''}`.toLowerCase();
  
  if (!combined) return null;
  
  // Check each keyword
  for (const [keyword, imageUrl] of Object.entries(EVENT_IMAGES)) {
    if (combined.includes(keyword)) {
      return imageUrl;
    }
  }
  
  return null;
};

/**
 * Get display image for an event - returns keyword-specific image when no image exists
 */
export const getEventDisplayImage = (
  imageUrl?: string | null,
  title?: string,
  location?: string
): string | undefined => {
  // For certain venues (cinemaxx, vhs, hochschulsport), always use keyword-specific images
  if (isHochschulsportEvent(title, location) || isKeywordVenue(location)) {
    return getKeywordImage(title, location) || DEFAULT_EVENT_IMAGE;
  }
  
  // If event has a real image that's not a placeholder, use it
  if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('default')) {
    return imageUrl;
  }
  
  // No image - try to find a keyword match
  const keywordImage = getKeywordImage(title, location);
  if (keywordImage) {
    return keywordImage;
  }
  
  return imageUrl || undefined;
};
