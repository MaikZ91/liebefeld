
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/chatTypes";
import UserGallery from './UserGallery';
import { userService } from '@/services/userService';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import ProfileEditor from './ProfileEditor';

// Import our new components
import DirectoryHeader from './directory/DirectoryHeader';
import UserList from './directory/UserList';
import UserLoadingState from './directory/UserLoadingState';

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
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('gallery');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const { refreshUserProfile } = useUserProfile();

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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'gallery' : 'list');
  };

  const handleOpenProfileEditor = () => {
    setProfileEditorOpen(true);
  };

  const handleProfileUpdate = () => {
    fetchOnlineUsers();
    fetchCurrentUserProfile();
    refreshUserProfile();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-black text-white border border-gray-800">
          <DirectoryHeader 
            viewMode={viewMode}
            toggleViewMode={toggleViewMode}
            currentUsername={currentUsername}
            onOpenProfileEditor={handleOpenProfileEditor}
          />
          
          <div className="py-4">
            <UserLoadingState 
              error={error} 
              loading={loading} 
              userCount={users.length} 
            />
            
            {!loading && !error && users.length > 0 && (
              viewMode === 'gallery' ? (
                <UserGallery 
                  users={users} 
                  currentUsername={currentUsername} 
                  onSelectUser={handleSelectUser} 
                />
              ) : (
                <UserList 
                  users={users}
                  currentUsername={currentUsername}
                  onSelectUser={handleSelectUser}
                />
              )
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
