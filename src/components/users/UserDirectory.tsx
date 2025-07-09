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

      setUsers(userProfiles || []);

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
