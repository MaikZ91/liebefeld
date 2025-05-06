
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if storage bucket exists and create it if needed
  const ensureStorageBucket = async () => {
    try {
      // Prüfen, ob der Bucket existiert
      const { data: buckets } = await supabase.storage.listBuckets();
      
      // Wenn der Bucket nicht existiert, erstellen
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        console.log('Creating avatars bucket');
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 5242880 // 5MB limit
        });
        console.log('Bucket created successfully');
      } else {
        console.log('Avatars bucket already exists');
      }
      
      // Immer die Policy setzen, um sicherzustellen, dass der Bucket öffentlich ist
      const { error: policyError } = await supabase.storage
        .from('avatars')
        .createSignedUrl('test.txt', 1); // Just to check if policies are working
      
      if (policyError) {
        console.log('Setting public access policy for avatars bucket');
        
        // Setze explizit öffentlichen Zugriff auf alle Dateien
        try {
          await supabase.rpc('ensure_avatar_policies');
          console.log('Public access policy set for avatars bucket');
        } catch (err) {
          console.log('Error setting public policy, but continuing:', err);
          // Fahre trotzdem fort
        }
      }
    } catch (err) {
      console.error('Error ensuring storage bucket exists:', err);
    }
  };
  
  // Benutzerprofil erstellen oder aktualisieren, wenn der Benutzername bekannt ist
  useEffect(() => {
    if (currentUser !== 'Gast') {
      initializeProfile();
    }
  }, [currentUser]);
  
  // Benutzerprofil initialisieren
  const initializeProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure storage bucket exists for avatar uploads
      await ensureStorageBucket();
      
      const avatar = localStorage.getItem(AVATAR_KEY);
      console.log('Current stored avatar:', avatar);
      
      try {
        console.log('Creating or updating profile for username:', currentUser);
        const profile = await userService.createOrUpdateProfile({
          username: currentUser,
          avatar: avatar || null,
          interests: ['Sport', 'Events', 'Kreativität'],
          hobbies: ['Tanzen', 'Musik', 'Kochen'],
          favorite_locations: []
        });
        
        console.log('Profile created/updated successfully:', profile);
        setUserProfile(profile);
      } catch (err: any) {
        console.error('Fehler beim Erstellen des Benutzerprofils:', err);
        toast({
          title: "Fehler",
          description: "Benutzerprofil konnte nicht erstellt werden: " + (err.message || 'Unbekannter Fehler'),
          variant: "destructive"
        });
        throw err;
      }
    } catch (err: any) {
      console.error('Fehler beim Initialisieren des Benutzerprofils:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
      
      toast({
        title: "Fehler",
        description: "Benutzerprofil konnte nicht initialisiert werden. Bitte später erneut versuchen.",
        variant: "destructive"
      });
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
