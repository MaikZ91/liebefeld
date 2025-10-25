import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Users, Settings, LogOut } from 'lucide-react';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import UserDirectory from './users/UserDirectory';
import ProfileEditor from './users/ProfileEditor';
import { useUserProfile } from '@/hooks/chat/useUserProfile';

const UserProfileButton: React.FC = () => {
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const { currentUser, userProfile, refetchProfile } = useUserProfile();
  
  const username = typeof window !== 'undefined' 
    ? localStorage.getItem(USERNAME_KEY) || 'User'
    : 'User';
    
  const avatarUrl = typeof window !== 'undefined'
    ? localStorage.getItem(AVATAR_KEY)
    : null;

  // Check if user has completed onboarding (has a username)
  const hasCompletedOnboarding = username !== 'User' && username !== 'Anonymous';

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(AVATAR_KEY);
    localStorage.removeItem('selectedCityAbbr');
    localStorage.removeItem('selectedCityName');
    // Reload to trigger onboarding
    window.location.reload();
  };

  if (!hasCompletedOnboarding) {
    return null; // Don't show button if onboarding not completed
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={username} />
              <AvatarFallback className="bg-red-500 text-white">
                {getInitials(username)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-black border-red-500/30" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-white">{username}</p>
              <p className="w-[200px] truncate text-sm text-gray-400">
                Mitglied der Community
              </p>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-red-500/30" />
          <DropdownMenuItem 
            className="text-white hover:bg-red-500/20 cursor-pointer"
            onClick={() => setIsDirectoryOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Community Directory</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-white hover:bg-red-500/20 cursor-pointer"
            onClick={() => setIsProfileEditorOpen(true)}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profil bearbeiten</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-white hover:bg-red-500/20 cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Einstellungen</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-red-500/30" />
          <DropdownMenuItem 
            className="text-white hover:bg-red-500/20 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Abmelden</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDirectory 
        open={isDirectoryOpen} 
        onOpenChange={setIsDirectoryOpen}
        onSelectUser={() => {}} // Empty function since we don't need user selection in this context
      />

      <ProfileEditor
        open={isProfileEditorOpen}
        onOpenChange={setIsProfileEditorOpen}
        currentUser={userProfile}
        onProfileUpdate={refetchProfile}
      />
    </>
  );
};

export default UserProfileButton;