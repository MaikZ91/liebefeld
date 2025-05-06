import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UserProfile } from "@/types/chatTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/utils/chatUIUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { userService } from '@/services/userService';
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, MapPin } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [newInterest, setNewInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Add the missing filteredLocations computed property
  const filteredLocations = locations.filter(location => 
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUser?.username || '',
      avatar: currentUser?.avatar || '',
    },
  });

  // Ensure the storage bucket exists
  useEffect(() => {
    async function ensureStorageBucket() {
      if (!open) return;
      
      try {
        await userService.ensureAvatarBucket();
      } catch (err) {
        console.error('Error ensuring bucket exists:', err);
      }
    }
    
    ensureStorageBucket();
  }, [open]);

  // Fetch locations from the database
  useEffect(() => {
    async function fetchLocations() {
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
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    }
    
    if (open) {
      fetchLocations();
    }
  }, [open]);

  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser) {
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
      
      console.log('Loaded current user data:', {
        username: currentUser.username,
        avatar: currentUser.avatar,
        interests: currentUser.interests,
        favorite_locations: currentUser.favorite_locations
      });
    }
  }, [currentUser, form]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests(prev => [...prev, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  // Fix for adding locations
  const handleAddLocation = () => {
    if (selectedLocation && !favoriteLocations.includes(selectedLocation)) {
      setFavoriteLocations(prev => [...prev, selectedLocation]);
      setSelectedLocation('');
      setPopoverOpen(false);
    }
  };

  const handleRemoveLocation = (location: string) => {
    setFavoriteLocations(favoriteLocations.filter(loc => loc !== location));
  };

  // Handle location selection
  const handleSelectLocation = (location: string) => {
    setSelectedLocation(location);
  };

  // Fix for image upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fehler",
        description: "Das Bild ist zu groß. Maximale Größe: 2MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fehler",
        description: "Nur Bilder können hochgeladen werden",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Use our improved upload service
      const publicUrl = await userService.uploadProfileImage(file);
        
      // Set the avatar URL in the form
      form.setValue('avatar', publicUrl);
      
      // Save the uploaded image URL
      setUploadedImage(publicUrl);
      
      toast({
        title: "Erfolg",
        description: "Bild erfolgreich hochgeladen",
        variant: "success"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen des Bildes",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!currentUser) return;
    
    console.log("Submit button clicked with values:", values);
    setIsSubmitting(true);
    
    try {
      // Verwende die tatsächliche Avatar-URL (entweder die neu hochgeladene oder die existierende)
      const avatarUrl = uploadedImage || values.avatar;
      
      console.log("Saving profile with data:", {
        username: values.username,
        avatar: avatarUrl,
        interests: interests,
        favorite_locations: favoriteLocations
      });
      
      // Speichere alle vier benötigten Felder
      const updatedProfile = await userService.createOrUpdateProfile({
        username: values.username,
        avatar: avatarUrl || null,
        interests: interests,
        favorite_locations: favoriteLocations
      });
      
      console.log("Profile updated successfully:", updatedProfile);
      
      // Update local storage with the new username and avatar
      localStorage.setItem('community_chat_username', values.username);
      if (avatarUrl) {
        localStorage.setItem('community_chat_avatar', avatarUrl);
      }
      
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
        description: "Fehler beim Aktualisieren des Profils",
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
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-3 border-2 border-red-500/50">
                <AvatarImage src={uploadedImage || form.watch('avatar') || ''} alt={form.watch('username')} />
                <AvatarFallback className="bg-red-500 text-2xl">
                  {getInitials(form.watch('username'))}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex items-center gap-2 mt-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                    <Upload size={16} />
                    <span>{uploading ? "Lädt hoch..." : "Bild hochladen"}</span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benutzername</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Benutzername eingeben"
                      {...field}
                      className="bg-gray-900 border-gray-700"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <Label>Interessen</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-gray-800 border-gray-700 flex items-center gap-1"
                  >
                    {interest}
                    <X 
                      size={14} 
                      className="cursor-pointer text-gray-400 hover:text-red-400" 
                      onClick={() => handleRemoveInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Neues Interesse"
                  className="bg-gray-900 border-gray-700"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={handleAddInterest}
                  variant="outline"
                  className="border-gray-700 text-white"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            
            {/* Lieblingslokationen */}
            <div className="space-y-2">
              <Label>Lieblingslokationen</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {favoriteLocations.map((location, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-gray-800 border-gray-700 flex items-center gap-1"
                  >
                    {location}
                    <X 
                      size={14} 
                      className="cursor-pointer text-gray-400 hover:text-red-400" 
                      onClick={() => handleRemoveLocation(location)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between bg-gray-900 border-gray-700 text-white"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {selectedLocation || "Lokation auswählen"}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-gray-900 border-gray-700 text-white">
                    <Command>
                      <CommandInput 
                        placeholder="Lokation suchen..." 
                        className="h-9 border-gray-700" 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="max-h-48 overflow-auto">
                            {filteredLocations.map((location) => (
                              <CommandItem
                                key={location}
                                value={location}
                                onSelect={() => handleSelectLocation(location)}
                                className="cursor-pointer hover:bg-gray-800"
                              >
                                {location}
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={handleAddLocation}
                  variant="outline"
                  className="border-gray-700 text-white"
                  disabled={!selectedLocation}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            
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
