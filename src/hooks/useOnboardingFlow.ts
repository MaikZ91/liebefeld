import { useState, useEffect, useCallback } from 'react';

export type OnboardingStep = 'welcome' | 'explain_app' | 'explain_likes' | 'waiting_for_like' | 'completed';

interface OnboardingState {
  currentStep: OnboardingStep;
  hasCompletedOnboarding: boolean;
}

export const useOnboardingFlow = () => {
  const [state, setState] = useState<OnboardingState>(() => {
    const completed = localStorage.getItem('tribe_onboarding_completed') === 'true';
    return {
      currentStep: completed ? 'completed' : 'welcome',
      hasCompletedOnboarding: completed,
    };
  });

  const advanceStep = useCallback(() => {
    setState(prev => {
      const steps: OnboardingStep[] = ['welcome', 'explain_app', 'explain_likes', 'waiting_for_like', 'completed'];
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

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('tribe_onboarding_completed', 'true');
    setState({
      currentStep: 'completed',
      hasCompletedOnboarding: true,
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('tribe_onboarding_completed');
    setState({
      currentStep: 'welcome',
      hasCompletedOnboarding: false,
    });
  }, []);

  return {
    ...state,
    advanceStep,
    completeOnboarding,
    resetOnboarding,
    isOnboarding: !state.hasCompletedOnboarding,
  };
};
