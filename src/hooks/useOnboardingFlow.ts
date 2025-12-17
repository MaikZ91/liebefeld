import { useState, useEffect, useCallback } from 'react';

export type OnboardingStep = 
  | 'welcome' 
  | 'explain_app' 
  | 'explain_likes' 
  | 'waiting_for_like' 
  | 'community_intro'
  | 'explain_profile' 
  | 'waiting_for_avatar_click'  // User needs to click avatar
  | 'editing_profile'           // User is editing profile
  | 'greeting_ready'
  | 'waiting_for_post'
  | 'completed';

interface OnboardingState {
  currentStep: OnboardingStep;
  hasCompletedOnboarding: boolean;
  hasCompletedProfile: boolean;
  hasPostedGreeting: boolean;
}

export const useOnboardingFlow = () => {
  const [state, setState] = useState<OnboardingState>(() => {
    const completed = localStorage.getItem('tribe_onboarding_completed') === 'true';
    const profileDone = localStorage.getItem('tribe_profile_onboarding_done') === 'true';
    const greetingPosted = localStorage.getItem('tribe_greeting_posted') === 'true';
    
    // Determine initial step based on saved progress
    let initialStep: OnboardingStep = 'welcome';
    if (completed) {
      initialStep = 'completed';
    } else if (greetingPosted) {
      initialStep = 'completed';
    } else if (profileDone) {
      initialStep = 'greeting_ready';
    }
    
    return {
      currentStep: initialStep,
      hasCompletedOnboarding: completed,
      hasCompletedProfile: profileDone,
      hasPostedGreeting: greetingPosted,
    };
  });

  const advanceStep = useCallback(() => {
    setState(prev => {
      const steps: OnboardingStep[] = [
        'welcome', 
        'explain_app', 
        'explain_likes', 
        'waiting_for_like',
        'community_intro',
        'explain_profile',
        'waiting_for_avatar_click',
        'editing_profile',
        'greeting_ready',
        'waiting_for_post',
        'completed'
      ];
      const currentIndex = steps.indexOf(prev.currentStep);
      const nextStep = steps[Math.min(currentIndex + 1, steps.length - 1)];
      
      if (nextStep === 'completed') {
        localStorage.setItem('tribe_onboarding_completed', 'true');
      }
      
      return {
        ...prev,
        currentStep: nextStep,
        hasCompletedOnboarding: nextStep === 'completed',
      };
    });
  }, []);

  const setStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      hasCompletedOnboarding: step === 'completed',
    }));
    
    if (step === 'completed') {
      localStorage.setItem('tribe_onboarding_completed', 'true');
    }
  }, []);

  const markProfileComplete = useCallback(() => {
    localStorage.setItem('tribe_profile_onboarding_done', 'true');
    setState(prev => ({
      ...prev,
      hasCompletedProfile: true,
      currentStep: 'greeting_ready',
    }));
  }, []);

  const markGreetingPosted = useCallback(() => {
    localStorage.setItem('tribe_greeting_posted', 'true');
    localStorage.setItem('tribe_onboarding_completed', 'true');
    setState(prev => ({
      ...prev,
      hasPostedGreeting: true,
      currentStep: 'completed',
      hasCompletedOnboarding: true,
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('tribe_onboarding_completed', 'true');
    setState({
      currentStep: 'completed',
      hasCompletedOnboarding: true,
      hasCompletedProfile: true,
      hasPostedGreeting: true,
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('tribe_onboarding_completed');
    localStorage.removeItem('tribe_profile_onboarding_done');
    localStorage.removeItem('tribe_greeting_posted');
    setState({
      currentStep: 'welcome',
      hasCompletedOnboarding: false,
      hasCompletedProfile: false,
      hasPostedGreeting: false,
    });
  }, []);

  // Generate personalized greeting from profile
  const generateGreeting = useCallback((profile: { username?: string; interests?: string[]; favorite_locations?: string[] }) => {
    const name = profile.username || 'ich';
    const interests = profile.interests || [];
    const locations = profile.favorite_locations || [];
    
    let greeting = `Hey, ich bin ${name}! 👋`;
    
    if (interests.length > 0) {
      const interestText = interests.slice(0, 3).join(', ');
      greeting += ` Ich steh auf ${interestText}`;
    }
    
    if (locations.length > 0) {
      const locationText = locations[0];
      greeting += interests.length > 0 
        ? ` und hänge gerne in ${locationText} rum.` 
        : ` Findet mich oft in ${locationText}.`;
    } else if (interests.length > 0) {
      greeting += '.';
    }
    
    greeting += '\n\n'; // Leave space for fun fact
    
    return greeting;
  }, []);

  // Check if we're in a step where avatar should blink
  const shouldAvatarBlink = state.currentStep === 'waiting_for_avatar_click';

  return {
    ...state,
    advanceStep,
    setStep,
    completeOnboarding,
    resetOnboarding,
    markProfileComplete,
    markGreetingPosted,
    generateGreeting,
    shouldAvatarBlink,
    isOnboarding: !state.hasCompletedOnboarding,
    isCommunityOnboarding: state.currentStep === 'community_intro' || 
                           state.currentStep === 'explain_profile' || 
                           state.currentStep === 'waiting_for_avatar_click' ||
                           state.currentStep === 'editing_profile' ||
                           state.currentStep === 'greeting_ready' ||
                           state.currentStep === 'waiting_for_post',
  };
};
