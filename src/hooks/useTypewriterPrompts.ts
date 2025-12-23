import { useState, useEffect, useMemo, useCallback } from 'react';
import { personalizationService } from '@/services/personalizationService';

interface UserProfileContext {
  username?: string;
  interests?: string[];
  favorite_locations?: string[];
  hobbies?: string[];
}

const TYPING_SPEED = 50;
const PAUSE_BEFORE_DELETE = 2500;
const DELETE_SPEED = 30;
const PAUSE_BETWEEN_PROMPTS = 500;

export const useTypewriterPrompts = (
  userProfile?: UserProfileContext,
  eventCategories?: string[],
  city?: string,
  priorityText?: string | null // Optional priority text to show first (e.g., onboarding message)
) => {
  const [displayText, setDisplayText] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showingPriorityText, setShowingPriorityText] = useState(!!priorityText);
  const [priorityCompleted, setPriorityCompleted] = useState(false);

  // Generate hyper-personalized prompts based on ALL user data
  const prompts = useMemo(() => {
    const generatedPrompts: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;

    // Get user behavior data
    const likes = personalizationService.getLikes();
    const preferences = personalizationService.getPreferences();
    const recentQueries = JSON.parse(localStorage.getItem('mia_recent_queries') || '[]').slice(0, 10);

    // Analyze liked event patterns
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
      .map(([cat]) => cat);

    // Get top liked locations
    const topLocations = Object.entries(preferences.likedLocations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([loc]) => loc);

    // Get top keywords from liked events
    const topKeywords = Object.entries(preferences.likedKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([kw]) => kw);

    // Get preferred time slots
    const preferredTimeSlots = personalizationService.getPreferredTimeSlots();
    const topTimeSlot = preferredTimeSlots[0]?.slot;

    // === HYPER-PERSONALIZED PROMPTS ===

    // 1. Based on liked categories (highest priority)
    topCategories.forEach(cat => {
      const catLower = cat.toLowerCase();
      if (catLower.includes('party') || catLower.includes('ausgehen') || catLower.includes('club')) {
        if (isFriday || isWeekend) {
          generatedPrompts.push('Wo wird heute gefeiert?');
          generatedPrompts.push('Beste Clubs heute Nacht');
        } else {
          generatedPrompts.push('Party am Wochenende?');
        }
      }
      if (catLower.includes('sport') || catLower.includes('fitness')) {
        generatedPrompts.push('Sport Events diese Woche');
        if (hour < 12) generatedPrompts.push('Morgen-Workout finden');
      }
      if (catLower.includes('konzert') || catLower.includes('musik')) {
        generatedPrompts.push('Live Musik heute');
        generatedPrompts.push('Konzerte diese Woche');
      }
      if (catLower.includes('kunst') || catLower.includes('kreativ')) {
        generatedPrompts.push('Kreativ-Workshops');
        generatedPrompts.push('Kunst Events entdecken');
      }
      if (catLower.includes('comedy') || catLower.includes('kabarett')) {
        generatedPrompts.push('Comedy Shows');
      }
    });

    // 2. Based on favorite locations from likes
    topLocations.forEach(loc => {
      generatedPrompts.push(`Was geht in ${loc}?`);
    });

    // 3. Based on user profile interests
    userProfile?.interests?.forEach(interest => {
      const intLower = interest.toLowerCase();
      if (!topCategories.some(c => c.toLowerCase().includes(intLower))) {
        if (intLower.includes('party')) generatedPrompts.push('Party-Highlights');
        if (intLower.includes('sport')) generatedPrompts.push('Fitness & Sport');
        if (intLower.includes('konzert')) generatedPrompts.push('Musik-Events');
        if (intLower.includes('kreativ')) generatedPrompts.push('Kreativ werden');
      }
    });

    // 4. Based on favorite locations from profile
    userProfile?.favorite_locations?.forEach(loc => {
      if (!topLocations.includes(loc)) {
        generatedPrompts.push(`Events in ${loc}`);
      }
    });

    // 5. Based on liked keywords
    topKeywords.forEach(kw => {
      if (kw.length > 4) {
        generatedPrompts.push(`Mehr ${kw} Events`);
      }
    });

    // 6. Based on recent queries (follow-up suggestions)
    if (recentQueries.length > 0) {
      const lastQuery = recentQueries[0].toLowerCase();
      if (lastQuery.includes('wochenende')) {
        generatedPrompts.push('Nächstes Wochenende?');
      }
      if (lastQuery.includes('heute')) {
        generatedPrompts.push('Und morgen?');
      }
    }

    // 7. Time-based personalization (using user's liked time slots)
    if (topTimeSlot === 'evening') {
      generatedPrompts.push('Events heute Abend');
      generatedPrompts.push('Abend-Highlights');
    } else if (topTimeSlot === 'night') {
      generatedPrompts.push('Late Night Events');
      generatedPrompts.push('Nachtleben entdecken');
    } else if (topTimeSlot === 'morning') {
      generatedPrompts.push('Frühe Events morgen');
      generatedPrompts.push('Morgen-Aktivitäten');
    } else if (topTimeSlot === 'afternoon') {
      generatedPrompts.push('Nachmittags-Events');
    } else if (topTimeSlot === 'midday') {
      generatedPrompts.push('Events zur Mittagszeit');
    }

    // Current time context
    if (hour >= 6 && hour < 12) {
      generatedPrompts.push('Was geht heute Abend?');
      generatedPrompts.push('Plane meinen Tag');
    } else if (hour >= 12 && hour < 17) {
      generatedPrompts.push('Events für heute Abend');
    } else if (hour >= 17 && hour < 21) {
      generatedPrompts.push('Was geht jetzt?');
      generatedPrompts.push('Spontane Ideen');
    } else {
      generatedPrompts.push('Late Night Events');
    }

    // 8. Day-based personalization (based on user's like patterns)
    if (prefersWeekend && !isWeekend && !isFriday) {
      generatedPrompts.push('Was geht am Wochenende?');
      generatedPrompts.push('Wochenend-Vorschau');
    } else if (!prefersWeekend && (isWeekend || isFriday)) {
      generatedPrompts.push('Entspannter Abend heute?');
    }

    if (isWeekend) {
      generatedPrompts.push('Wochenend-Highlights');
    } else if (isFriday) {
      generatedPrompts.push('Start ins Wochenende');
    }

    // 9. City-based
    if (city) {
      generatedPrompts.push(`Geheimtipps in ${city}`);
    }

    // 10. Fallbacks (only if we have few personalized prompts)
    if (generatedPrompts.length < 5) {
      generatedPrompts.push('Mein perfekter Tag');
      generatedPrompts.push('Überrasch mich!');
      generatedPrompts.push('Was geht heute?');
    }

    // Return unique prompts, shuffled
    const uniquePrompts = [...new Set(generatedPrompts)];
    return uniquePrompts.sort(() => Math.random() - 0.5).slice(0, 12);
  }, [userProfile, eventCategories, city]);

  // Reset priority text state when priorityText changes
  useEffect(() => {
    if (priorityText) {
      setShowingPriorityText(true);
      setPriorityCompleted(false);
      setDisplayText('');
      setIsTyping(true);
    } else {
      setShowingPriorityText(false);
    }
  }, [priorityText]);

  // Determine current text to display
  const currentText = showingPriorityText && priorityText ? priorityText : prompts[currentPromptIndex] || '';

  const currentPrompt = currentText;

  // Typewriter effect
  useEffect(() => {
    if (isPaused) return;
    
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (displayText.length < currentPrompt.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // If showing priority text, stay on it longer and don't delete
        if (showingPriorityText) {
          // Keep priority text visible, don't cycle
          return;
        }
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_BEFORE_DELETE);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        timeout = setTimeout(() => {
          setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
          setIsTyping(true);
        }, PAUSE_BETWEEN_PROMPTS);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentPrompt, prompts.length, isPaused, showingPriorityText]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const getCurrentFullPrompt = useCallback(() => {
    return currentPrompt;
  }, [currentPrompt]);

  return {
    displayText,
    currentFullPrompt: currentPrompt,
    pause,
    resume,
    isPaused,
    getCurrentFullPrompt,
    allPrompts: prompts, // Export all prompts for suggestions
  };
};
