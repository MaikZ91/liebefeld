import { useMemo, useState, useEffect, useRef } from 'react';
import { personalizationService } from '@/services/personalizationService';

interface UserProfileContext {
  username?: string;
  interests?: string[];
  favorite_locations?: string[];
  hobbies?: string[];
}

export const usePersonalizedSuggestions = (
  userProfile?: UserProfileContext,
  city?: string
) => {
  const pool = useMemo(() => {
    const generated: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;

    // Get user behavior data
    const likes = personalizationService.getLikes();
    const preferences = personalizationService.getPreferences();
    const recentQueries = JSON.parse(localStorage.getItem('mia_recent_queries') || '[]').slice(0, 5);

    // Analyze liked event day patterns
    const likedEventDays: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    likes.forEach(like => {
      try {
        const likeDate = new Date(like.timestamp);
        likedEventDays[likeDate.getDay()]++;
      } catch {}
    });
    
    const weekendLikes = likedEventDays[0] + likedEventDays[6] + likedEventDays[5];
    const weekdayLikes = likedEventDays[1] + likedEventDays[2] + likedEventDays[3] + likedEventDays[4];
    const prefersWeekend = weekendLikes > weekdayLikes;

    // Get top liked categories
    const topCategories = Object.entries(preferences.likedCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat.toLowerCase());

    // Get top liked locations  
    const topLocations = Object.entries(preferences.likedLocations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([loc]) => loc);

    // === CATEGORY-BASED SUGGESTIONS ===
    if (topCategories.some(c => c.includes('party') || c.includes('ausgehen') || c.includes('club'))) {
      generated.push(isWeekend || isFriday ? 'Beste Parties heute' : 'Party am Wochenende');
    }
    if (topCategories.some(c => c.includes('sport'))) {
      generated.push('Sport & Fitness');
    }
    if (topCategories.some(c => c.includes('konzert') || c.includes('musik'))) {
      generated.push('Live Musik');
    }
    if (topCategories.some(c => c.includes('kunst') || c.includes('kreativ'))) {
      generated.push('Kreativ-Events');
    }
    if (topCategories.some(c => c.includes('comedy'))) {
      generated.push('Comedy Shows');
    }

    // === LOCATION-BASED SUGGESTIONS ===
    topLocations.forEach(loc => {
      if (loc && loc.length > 2) {
        generated.push(`In ${loc}`);
      }
    });

    // === PROFILE-BASED SUGGESTIONS ===
    userProfile?.interests?.forEach(interest => {
      const intLower = interest.toLowerCase();
      if (!generated.some(g => g.toLowerCase().includes(intLower.slice(0, 4)))) {
        if (intLower.includes('party') && !generated.includes('Beste Parties heute') && !generated.includes('Party am Wochenende')) {
          generated.push('Party finden');
        }
        if (intLower.includes('sport') && !generated.includes('Sport & Fitness')) {
          generated.push('Sport Events');
        }
      }
    });

    userProfile?.favorite_locations?.forEach(loc => {
      if (!topLocations.includes(loc) && loc && loc.length > 2) {
        generated.push(`Events ${loc}`);
      }
    });

    // === TIME-BASED SUGGESTIONS ===
    if (hour >= 17 && hour < 21) {
      generated.push('Heute Abend');
    } else if (hour >= 21 || hour < 6) {
      generated.push('Jetzt noch');
    } else {
      generated.push('Heute');
    }

    // === DAY-PATTERN SUGGESTIONS ===
    if (prefersWeekend && !isWeekend) {
      generated.push('Am Wochenende');
    }
    if (isWeekend) {
      generated.push('Wochenend-Tipps');
    }

    // === QUERY-FOLLOW-UP SUGGESTIONS ===
    if (recentQueries.length > 0) {
      const lastQuery = recentQueries[0].toLowerCase();
      if (lastQuery.includes('party')) generated.push('Mehr Parties');
      if (lastQuery.includes('sport')) generated.push('Mehr Sport');
      if (lastQuery.includes('heute')) generated.push('Morgen');
    }

    // === GENERIC FALLBACKS ===
    generated.push('Mein perfekter Tag');
    generated.push('Überrasch mich');
    generated.push('Was geht heute?');
    generated.push('Geheimtipps');

    // Return unique full pool
    return [...new Set(generated)];
  }, [userProfile, city]);

  // Store pool in ref to avoid re-triggering effects
  const poolRef = useRef(pool);
  poolRef.current = pool;

  // Shuffle helper
  const shuffle = (arr: string[], exclude: string[] = []): string[] => {
    const available = arr.filter(item => !exclude.includes(item));
    const copy = available.length >= 5 ? [...available] : [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 5);
  };

  const [displayed, setDisplayed] = useState<string[]>(() => {
    return ['Mein perfekter Tag', 'Überrasch mich', 'Was geht heute?', 'Geheimtipps', 'Heute'];
  });

  // Set initial suggestions once when pool is first populated
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && pool.length > 0) {
      initializedRef.current = true;
      setDisplayed(shuffle(pool));
    }
  }, [pool]);

  // Rotate every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentPool = poolRef.current;
      if (currentPool.length > 5) {
        setDisplayed(prev => shuffle(currentPool, prev));
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  return displayed;
};
