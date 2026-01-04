import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/chatTypes";
import UserGallery from './UserGallery';
import { userService } from '@/services/userService';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import ProfileEditor from './ProfileEditor';

// Import our new components
import DirectoryHeader from './directory/DirectoryHeader';
import UserLoadingState from './directory/UserLoadingState';
import { Input } from '@/components/ui/input';

interface UserDirectoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: UserProfile) => void;
  currentUsername?: string;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({
  open,
  onOpenChange,
  onSelectUser,
  currentUsername
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const { refetchProfile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchOnlineUsers();
      if (currentUsername && currentUsername !== 'Gast') {
        fetchCurrentUserProfile();
      }
    }
  }, [open, currentUsername]);

  const fetchCurrentUserProfile = async () => {
    if (!currentUsername || currentUsername === 'Gast') return;
    
    try {
      const userProfile = await userService.getUserByUsername(currentUsername);
      if (userProfile) {
        setCurrentUserProfile(userProfile);
      }
    } catch (err) {
      console.error('Error fetching current user profile:', err);
    }
  };

  // Check if avatar is a custom uploaded image (not a default assigned one)
  const hasCustomAvatar = (avatar: string | null | undefined): boolean => {
    if (!avatar) return false;
    // Custom uploads are stored in Supabase storage or lovable-uploads
    // Default avatars typically start with specific patterns like numbered files
    const isUploadedImage = avatar.includes('supabase') || 
                            avatar.includes('lovable-uploads') ||
                            avatar.startsWith('blob:') ||
                            avatar.startsWith('data:');
    return isUploadedImage;
  };

  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get actual user profiles from the user_profiles table
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('last_online', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Sort: prioritize profiles with custom avatars, then by last_online
      const sortedProfiles = (userProfiles || []).sort((a, b) => {
        const aHasCustom = hasCustomAvatar(a.avatar);
        const bHasCustom = hasCustomAvatar(b.avatar);
        
        // If one has custom avatar and other doesn't, prioritize custom
        if (aHasCustom && !bHasCustom) return -1;
        if (!aHasCustom && bHasCustom) return 1;
        
        // Both have same avatar status, sort by last_online
        const aTime = a.last_online ? new Date(a.last_online).getTime() : 0;
        const bTime = b.last_online ? new Date(b.last_online).getTime() : 0;
        return bTime - aTime;
      });

      setUsers(sortedProfiles);

    } catch (err: any) {
      console.error('Error fetching online users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    onSelectUser(user);
    onOpenChange(false);
  };

  const handleOpenProfileEditor = () => {
    setProfileEditorOpen(true);
  };

  const handleProfileUpdate = () => {
    fetchOnlineUsers();
    fetchCurrentUserProfile();
    refetchProfile();
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const inInterests = user.interests?.some(interest =>
      interest.toLowerCase().includes(lowerCaseSearchTerm)
    );
    const inLocations = user.favorite_locations?.some(location =>
      location.toLowerCase().includes(lowerCaseSearchTerm)
    );
    const inUsername = user.username.toLowerCase().includes(lowerCaseSearchTerm);

    return inInterests || inLocations || inUsername;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl bg-black text-white border-gray-800 p-0 [&>button]:text-white [&>button]:hover:text-gray-300 z-[9999]">
          <DialogHeader className="sr-only">
            <DialogTitle>Benutzer Verzeichnis</DialogTitle>
          </DialogHeader>
          <div className="p-6 pb-0">
            <DirectoryHeader 
              currentUsername={currentUsername}
              onOpenProfileEditor={handleOpenProfileEditor}
            />
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Suche nach Tribes, Interessen, Orten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border-gray-700 focus:ring-red-500 focus:border-red-500 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <div className="py-4">
            {loading ? (
              <div className="px-6">
                <UserLoadingState loading={true} error={null} userCount={0} />
              </div>
            ) : error ? (
              <div className="px-6">
                <UserLoadingState loading={false} error={error} userCount={0} />
              </div>
            ) : filteredUsers.length > 0 ? (
              <UserGallery 
                users={filteredUsers} 
                currentUsername={currentUsername} 
                onSelectUser={handleSelectUser} 
              />
            ) : (
              <div className="px-6 text-center py-10">
                <p className="text-gray-400">
                  {searchTerm 
                    ? `Keine Profile für "${searchTerm}" gefunden.`
                    : "Aktuell sind keine anderen Benutzer online."
                  }
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProfileEditor 
        open={profileEditorOpen}
        onOpenChange={setProfileEditorOpen}
        currentUser={currentUserProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default UserDirectory;
