import React, { useState, useEffect } from 'react';
import OnboardingChatbot from './OnboardingChatbot';
import { USERNAME_KEY } from '@/types/chatTypes';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const username = localStorage.getItem(USERNAME_KEY);
    if (!username || username === 'Anonymous') {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      <OnboardingChatbot 
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};

export default OnboardingManager;