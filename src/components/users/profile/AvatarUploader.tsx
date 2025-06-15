import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { userService } from '@/services/userService';
import { toast } from "@/hooks/use-toast";
import { AVATAR_KEY } from '@/types/chatTypes';

interface AvatarUploaderProps {
  username: string;
  currentAvatar: string | null | undefined;
  onAvatarChange: (avatarUrl: string) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  username,
  currentAvatar,
  onAvatarChange
}) => {
  const [uploading, setUploading] = useState(false);

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
      console.log('Uploading file:', file.name);
      
      // Upload image using service
      const publicUrl = await userService.uploadProfileImage(file);
      
      // Update the avatar
      onAvatarChange(publicUrl);
      
      console.log('Image uploaded successfully:', publicUrl);
      
      // Save to localStorage immediately to ensure it's available
      localStorage.setItem(AVATAR_KEY, publicUrl);
      
      toast({
        title: "Erfolg",
        description: "Bild erfolgreich hochgeladen",
        variant: "success"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen des Bildes, fallback verwendet",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <Avatar className="h-32 w-32 mb-3 border-4 border-red-500/50">
        <AvatarImage src={currentAvatar || ''} alt={username} />
        <AvatarFallback className="bg-red-500 text-4xl">
          {getInitials(username)}
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
  );
};

export default AvatarUploader;
