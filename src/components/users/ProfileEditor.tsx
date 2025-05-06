
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UserProfile } from "@/types/chatTypes";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { userService } from '@/services/userService';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';

// Import our new components
import AvatarUploader from './profile/AvatarUploader';
import UsernameField from './profile/UsernameField';
import InterestsEditor from './profile/InterestsEditor';
import LocationSelector from './profile/LocationSelector';

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserProfile | null;
  onProfileUpdate: () => void;
}

const profileSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  avatar: z.string().optional(),
});

const ProfileEditor: React.FC<ProfileEditorProps> = ({
  open,
  onOpenChange,
  currentUser,
  onProfileUpdate
}) => {
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUser?.username || '',
      avatar: currentUser?.avatar || '',
    },
  });

  // Initialize component data from current user
  useEffect(() => {
    if (currentUser) {
      console.log('Loading current user data into form:', currentUser);
      
      form.reset({
        username: currentUser.username,
        avatar: currentUser.avatar || '',
      });
      
      // Reset uploadedImage when currentUser changes
      setUploadedImage(null);
      
      // Set interests from currentUser
      setInterests(currentUser.interests || []);
      
      // Set favorite locations
      setFavoriteLocations(currentUser.favorite_locations || []);
      
      console.log('Form initialized with:', {
        username: currentUser.username,
        avatar: currentUser.avatar,
        interests: currentUser.interests || [],
        favorite_locations: currentUser.favorite_locations || []
      });
    }
  }, [currentUser, form]);

  // Fetch locations from the database
  useEffect(() => {
    async function fetchLocations() {
      if (!open) return;
      
      try {
        const { data, error } = await supabase
          .from('unique_locations')
          .select('location');
          
        if (error) {
          console.error('Error fetching locations:', error);
          return;
        }
        
        // Extract locations from the data
        const locationList = data
          .map(item => item.location)
          .filter(Boolean) as string[];
          
        setLocations(locationList);
        console.log('Fetched locations:', locationList.length);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    }
    
    if (open) {
      fetchLocations();
    }
  }, [open]);

  // Handle avatar update
  const handleAvatarUpdate = (avatarUrl: string) => {
    // Set the avatar URL in the form
    form.setValue('avatar', avatarUrl);
    
    // Save the uploaded image URL
    setUploadedImage(avatarUrl);
  };

  // Save function
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!values.username) return;
    
    console.log("Submit button clicked with values:", values);
    setIsSubmitting(true);
    
    try {
      // Use actual Avatar URL
      const avatarUrl = uploadedImage || values.avatar;
      
      console.log("Saving profile with data:", {
        username: values.username,
        avatar: avatarUrl,
        interests: interests,
        favorite_locations: favoriteLocations
      });
      
      // Save username in localStorage
      localStorage.setItem(USERNAME_KEY, values.username);
      
      // Save avatar in localStorage
      if (avatarUrl) {
        localStorage.setItem(AVATAR_KEY, avatarUrl);
      }
      
      // Save all four required fields
      const updatedProfile = await userService.createOrUpdateProfile({
        username: values.username,
        avatar: avatarUrl || null,
        interests: interests,
        favorite_locations: favoriteLocations
      });
      
      console.log("Profile updated successfully:", updatedProfile);
      
      toast({
        title: "Erfolg",
        description: "Profil erfolgreich aktualisiert!",
        variant: "success"
      });
      
      onProfileUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Profils. Bitte versuche es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black text-white border border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Profil bearbeiten</DialogTitle>
          <DialogDescription className="text-gray-400">
            Hier kannst du dein Profil anpassen.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AvatarUploader 
              username={form.watch('username')}
              currentAvatar={uploadedImage || form.watch('avatar')}
              onAvatarChange={handleAvatarUpdate}
            />
            
            <UsernameField form={form} />
            
            <InterestsEditor 
              interests={interests}
              onInterestsChange={setInterests}
            />
            
            <LocationSelector
              locations={locations}
              favoriteLocations={favoriteLocations}
              onLocationsChange={setFavoriteLocations}
            />
            
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-700 text-white"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
