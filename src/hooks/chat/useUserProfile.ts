
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';

export const useUserProfile = () => {
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Benutzerprofil erstellen oder aktualisieren, wenn der Benutzername bekannt ist
  useEffect(() => {
    if (currentUser !== 'Gast') {
      initializeProfile();
    }
  }, [currentUser]);
  
  // Benutzerprofil initialisieren mit besserer Fehlerbehandlung
  const initializeProfile = async () => {
    if (currentUser === 'Gast') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const avatar = localStorage.getItem(AVATAR_KEY);
      console.log('Current username:', currentUser);
      console.log('Avatar from localStorage:', avatar);
      
      // Versuche das Profil zu holen oder zu erstellen
      try {
        const profileData = {
          username: currentUser,
          avatar: avatar || null,
          interests: [] as string[],
          favorite_locations: [] as string[]
        };
        
        let profile = await userService.getUserByUsername(currentUser);
        
        if (!profile) {
          console.log('User does not exist yet, creating new profile');
          profile = await userService.createOrUpdateProfile(profileData);
        } else {
          console.log('Found existing profile:', profile);
        }
        
        setUserProfile(profile);
        console.log('Profile initialized successfully:', profile);
      } catch (err: any) {
        console.error('Fehler beim Initialisieren des Benutzerprofils:', err);
        setError('Profilinitialisierung fehlgeschlagen');
        
        toast({
          title: "Fehler",
          description: "Benutzerprofil konnte nicht initialisiert werden.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Online-Status aktualisieren
  const updateLastOnline = async () => {
    if (currentUser !== 'Gast') {
      try {
        await userService.updateLastOnline(currentUser);
      } catch (err) {
        console.error('Fehler beim Aktualisieren der letzten Online-Zeit:', err);
      }
    }
  };
  
  // Benutzerprofil aktualisieren nach Änderungen
  const refreshUserProfile = async () => {
    if (currentUser !== 'Gast') {
      await initializeProfile();
    }
  };
  
  // Online-Status beim Initialisieren und regelmäßig aktualisieren
  useEffect(() => {
    if (currentUser !== 'Gast') {
      updateLastOnline();
      
      // Online-Status alle 5 Minuten aktualisieren
      const interval = setInterval(updateLastOnline, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);
  
  return {
    currentUser,
    userProfile,
    loading,
    error,
    updateLastOnline,
    refreshUserProfile
  };
};
