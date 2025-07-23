// src/components/OnboardingManager.tsx
import React, { useState, useEffect } from 'react';
import OnboardingChatbot from './OnboardingChatbot';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { useNavigate } from 'react-router-dom'; // Importiere useNavigate für die Navigation

interface OnboardingManagerProps {
  children: React.ReactNode;
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate(); // Initialisiere den navigate Hook

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

  // Angepasste handleOnboardingComplete Funktion, um die Aktion zu empfangen
  const handleOnboardingComplete = (action: 'community_chat' | 'event_heatmap') => {
    setShowOnboarding(false); // Schließt das Onboarding-Fenster
    
    // Leitet basierend auf der ausgewählten Aktion weiter
    if (action === 'community_chat') {
      navigate('/chat'); // Navigiert zum Community Chat
    } else if (action === 'event_heatmap') {
      navigate('/heatmap'); // Navigiert zur Event Heatmap
    }
  };

  return (
    <>
      {children}
      <OnboardingChatbot 
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete} // Übergibt die angepasste Funktion
      />
    </>
  );
};

export default OnboardingManager;