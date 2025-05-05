
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { X, Plus, Upload } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

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

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUser?.username || '',
      avatar: currentUser?.avatar || '',
    },
  });

  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      form.reset({
        username: currentUser.username,
        avatar: currentUser.avatar || '',
      });
      // Combine both interests and hobbies into a single array
      const combinedInterests = [
        ...(currentUser.interests || []),
        ...(currentUser.hobbies || [])
      ];
      setInterests([...new Set(combinedInterests)]); // Remove duplicates
    }
  }, [currentUser, form]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Das Bild ist zu groß. Maximale Größe: 2MB");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Nur Bilder können hochgeladen werden");
      return;
    }
    
    try {
      setUploading(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Set the avatar URL in the form
      form.setValue('avatar', publicUrl);
      toast.success("Bild erfolgreich hochgeladen");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await userService.createOrUpdateProfile({
        username: values.username,
        avatar: values.avatar || null,
        interests: interests,
        hobbies: [] // We're now storing everything in interests
      });
      
      // Update local storage with the new username and avatar
      localStorage.setItem('community_chat_username', values.username);
      if (values.avatar) {
        localStorage.setItem('community_chat_avatar', values.avatar);
      }
      
      toast.success("Profil erfolgreich aktualisiert!");
      onProfileUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Fehler beim Aktualisieren des Profils");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black text-white border border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Profil bearbeiten</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-3 border-2 border-red-500/50">
                <AvatarImage src={form.watch('avatar') || ''} alt={form.watch('username')} />
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
