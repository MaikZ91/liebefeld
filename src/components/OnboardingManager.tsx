// src/components/OnboardingManager.tsx
import React, { useEffect } from 'react';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';

interface OnboardingManagerProps {
  children: React.ReactNode;
  // New prop to receive the callback from App.tsx
  onFinalAction: (action: 'community_chat' | 'event_heatmap') => void;
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ children, onFinalAction }) => {
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
  }, []);

  return <>{children}</>;
};

export default OnboardingManager;