
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/chatTypes';

export const userService = {
  /**
   * Benutzerprofile abrufen
   */
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('last_online', { ascending: false });
      
    if (error) {
      console.error('Fehler beim Abrufen von Benutzerprofilen:', error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * Ein einzelnes Benutzerprofil abrufen
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
      
    if (error) {
      console.error('Fehler beim Abrufen des Benutzerprofils:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Benutzerprofil erstellen oder aktualisieren
   */
  async createOrUpdateProfile(profile: Partial<UserProfile> & { username: string }): Promise<UserProfile> {
    try {
      console.log('Creating or updating profile with data:', profile);
      
      // Stellen wir sicher, dass der Avatar-Bucket existiert
      await this.ensureAvatarBucket();

      // Vereinfachter Upsert mit vollem Profil
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          username: profile.username,
          avatar: profile.avatar || null,
          interests: profile.interests || [],
          favorite_locations: profile.favorite_locations || [],
          last_online: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Fehler beim Erstellen/Aktualisieren des Benutzerprofils:', error);
        throw error;
      }
      
      console.log('Profile saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Fehler in createOrUpdateProfile:', error);
      throw error;
    }
  },
  
  /**
   * Letzte Online-Zeit aktualisieren
   */
  async updateLastOnline(username: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ last_online: new Date().toISOString() })
      .eq('username', username);
      
    if (error) {
      console.error('Fehler beim Aktualisieren der letzten Online-Zeit:', error);
      throw error;
    }
  },

  /**
   * Stellen Sie sicher, dass der Avatar-Bucket existiert und öffentlich ist
   */
  async ensureAvatarBucket(): Promise<void> {
    try {
      // Prüfen ob der Bucket existiert
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        // Bucket nicht gefunden, erstelle ihn
        console.log('Creating avatars bucket');
        const { error: bucketError } = await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
        });
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          throw bucketError;
        }
      } else {
        // Ensure bucket is public
        await supabase.storage.updateBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2
        });
      }
      
      // Rufen Sie die SQL-Funktion auf, um Bucket-Richtlinien festzulegen
      // Da ensure_avatar_policies keine typisierten Parameter erwartet, verwenden wir eine allgemeine Methode
      try {
        // @ts-ignore - Ignore type checking for this specific RPC call
        const { error: functionError } = await supabase.rpc('ensure_avatar_policies');
        if (functionError) {
          console.error('Error ensuring avatar policies:', functionError);
          // Kein Throw hier, da dies nicht kritisch ist und die Funktion möglicherweise nicht existiert
        }
      } catch (rpcErr) {
        console.error('Error calling ensure_avatar_policies RPC:', rpcErr);
        // Wir werfen den Fehler nicht, da dies nicht kritisch für die Funktionalität ist
      }
    } catch (err) {
      console.error('Error ensuring avatar bucket exists:', err);
      throw err;
    }
  },

  /**
   * Bild zum Storage hochladen
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      // Ensure the avatars bucket exists
      await this.ensureAvatarBucket();

      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading file to avatars bucket:', filePath);

      // Datei hochladen
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Überschreibe Dateien mit dem gleichen Namen
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Öffentliche URL abrufen
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully. Public URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
};
