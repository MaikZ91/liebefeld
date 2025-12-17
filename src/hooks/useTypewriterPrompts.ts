import { useState, useEffect, useMemo, useCallback } from 'react';

interface UserProfileContext {
  username?: string;
  interests?: string[];
  favorite_locations?: string[];
  hobbies?: string[];
}

const TYPING_SPEED = 50; // ms per character
const PAUSE_BEFORE_DELETE = 2000; // ms to show full text
const DELETE_SPEED = 30; // ms per character when deleting
const PAUSE_BETWEEN_PROMPTS = 500; // ms pause between prompts

export const useTypewriterPrompts = (
  userProfile?: UserProfileContext,
  eventCategories?: string[],
  city?: string
) => {
  const [displayText, setDisplayText] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Generate hyper-personalized prompts
  const prompts = useMemo(() => {
    const generatedPrompts: string[] = [];
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;

    // Get previously asked questions from localStorage
    const recentQueries = JSON.parse(localStorage.getItem('mia_recent_queries') || '[]').slice(0, 5);

    // Time-based personalized prompts
    if (hour >= 6 && hour < 12) {
      generatedPrompts.push('Was geht heute Abend?');
      generatedPrompts.push('Plane meinen Tag');
    } else if (hour >= 12 && hour < 17) {
      generatedPrompts.push('Events für heute Abend');
      generatedPrompts.push('Was kann ich heute erleben?');
    } else if (hour >= 17 && hour < 21) {
      generatedPrompts.push('Was geht jetzt gerade?');
      generatedPrompts.push('Spontane Ideen für heute');
    } else {
      generatedPrompts.push('Late Night Events');
      generatedPrompts.push('Was geht noch?');
    }

    // Weekend/Friday specific
    if (isWeekend) {
      generatedPrompts.push('Wochenend-Highlights');
      generatedPrompts.push('Die besten Events heute');
    } else if (isFriday) {
      generatedPrompts.push('Party heute Nacht?');
      generatedPrompts.push('Start ins Wochenende');
    }

    // Interest-based prompts
    if (userProfile?.interests?.length) {
      userProfile.interests.forEach(interest => {
        const interestLower = interest.toLowerCase();
        if (interestLower.includes('party') || interestLower.includes('ausgehen')) {
          generatedPrompts.push('Beste Clubs heute');
          generatedPrompts.push('Wo wird gefeiert?');
        }
        if (interestLower.includes('sport')) {
          generatedPrompts.push('Sport Events diese Woche');
          generatedPrompts.push('Fitness Veranstaltungen');
        }
        if (interestLower.includes('kunst') || interestLower.includes('kultur')) {
          generatedPrompts.push('Kunst & Kultur entdecken');
          generatedPrompts.push('Ausstellungen in der Nähe');
        }
        if (interestLower.includes('musik') || interestLower.includes('konzert')) {
          generatedPrompts.push('Live Musik heute');
          generatedPrompts.push('Welche Konzerte gibt es?');
        }
        if (interestLower.includes('food') || interestLower.includes('essen')) {
          generatedPrompts.push('Food Events & Märkte');
        }
        if (interestLower.includes('comedy')) {
          generatedPrompts.push('Comedy Shows diese Woche');
        }
      });
    }

    // Location-based prompts
    if (userProfile?.favorite_locations?.length) {
      const location = userProfile.favorite_locations[0];
      generatedPrompts.push(`Was geht in ${location}?`);
    }

    // City-based prompts
    if (city) {
      generatedPrompts.push(`Geheimtipps in ${city}`);
    }

    // Hobby-based prompts
    if (userProfile?.hobbies?.length) {
      const hobby = userProfile.hobbies[0];
      generatedPrompts.push(`${hobby} Events finden`);
    }

    // Follow-up prompts based on recent queries
    if (recentQueries.length > 0) {
      const lastQuery = recentQueries[0];
      if (lastQuery.toLowerCase().includes('party')) {
        generatedPrompts.push('Mehr Parties zeigen');
      }
      if (lastQuery.toLowerCase().includes('sport')) {
        generatedPrompts.push('Weitere Sport Events');
      }
    }

    // Category-based prompts from available events
    if (eventCategories?.length) {
      if (eventCategories.includes('comedy')) {
        generatedPrompts.push('Stand-up Comedy');
      }
      if (eventCategories.includes('theater')) {
        generatedPrompts.push('Theater heute');
      }
    }

    // Generic fallbacks
    generatedPrompts.push('Mein perfekter Tag');
    generatedPrompts.push('Überrasch mich!');
    generatedPrompts.push('Events mit Freunden');

    // Return unique prompts, shuffled for variety
    const uniquePrompts = [...new Set(generatedPrompts)];
    return uniquePrompts.sort(() => Math.random() - 0.5).slice(0, 10);
  }, [userProfile, eventCategories, city]);

  const currentPrompt = prompts[currentPromptIndex] || '';

  // Typewriter effect
  useEffect(() => {
    if (isPaused) return;
    
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      // Typing phase
      if (displayText.length < currentPrompt.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // Finished typing, pause then start deleting
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_BEFORE_DELETE);
      }
    } else {
      // Deleting phase
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        // Finished deleting, move to next prompt
        timeout = setTimeout(() => {
          setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
          setIsTyping(true);
        }, PAUSE_BETWEEN_PROMPTS);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentPrompt, prompts.length, isPaused]);

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
  };
};
