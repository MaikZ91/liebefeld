import React, { useState, useEffect } from 'react';
import OnboardingChatbot from './OnboardingChatbot';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Clean up any conflicting localStorage data from old profile system
    const cleanupOldData = () => {
      const oldCityAbbr = localStorage.getItem('selectedCityAbbr');
      const oldCityName = localStorage.getItem('selectedCityName');
      const username = localStorage.getItem(USERNAME_KEY);
      
      // If we have old city data but no proper username, clear everything for fresh onboarding
      if ((oldCityAbbr || oldCityName) && (!username || username === 'Anonymous' || username === 'User')) {
        localStorage.removeItem('selectedCityAbbr');
        localStorage.removeItem('selectedCityName');
        localStorage.removeItem(USERNAME_KEY);
        localStorage.removeItem(AVATAR_KEY);
        console.log('Cleaned up old profile data for fresh onboarding');
      }
    };

    cleanupOldData();

    // Check if user has completed onboarding properly
    const username = localStorage.getItem(USERNAME_KEY);
    const hasValidUsername = username && username !== 'Anonymous' && username !== 'User' && username.trim().length > 0;
    
    if (!hasValidUsername) {
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