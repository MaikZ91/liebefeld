
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UserProfile } from "@/types/chatTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/utils/chatUIUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { userService } from '@/services/userService';
import { Badge } from "@/components/ui/badge";
import { X, Plus } from 'lucide-react';
import { toast } from "sonner";

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
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setInterests(currentUser.interests || []);
      setHobbies(currentUser.hobbies || []);
    }
  }, [currentUser, form]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleAddHobby = () => {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      setHobbies([...hobbies, newHobby.trim()]);
      setNewHobby('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleRemoveHobby = (hobby: string) => {
    setHobbies(hobbies.filter(h => h !== hobby));
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await userService.createOrUpdateProfile({
        username: values.username,
        avatar: values.avatar || null,
        interests: interests,
        hobbies: hobbies
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
            
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="URL des Avatarbildes"
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
            
            <div className="space-y-2">
              <Label>Hobbys</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hobbies.map((hobby, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-gray-800 border-gray-700 flex items-center gap-1"
                  >
                    {hobby}
                    <X 
                      size={14} 
                      className="cursor-pointer text-gray-400 hover:text-red-400" 
                      onClick={() => handleRemoveHobby(hobby)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newHobby}
                  onChange={(e) => setNewHobby(e.target.value)}
                  placeholder="Neues Hobby"
                  className="bg-gray-900 border-gray-700"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHobby())}
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={handleAddHobby}
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
