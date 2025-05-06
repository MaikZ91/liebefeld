
import React, { useState, useEffect, useRef } from 'react';
import ChatGroup from './chat/ChatGroup';
import { UserProfile } from '@/types/chatTypes';
import UserDirectory from './users/UserDirectory';
import PrivateChat from './users/PrivateChat';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { Button } from '@/components/ui/button';
import ProfileEditor from './users/ProfileEditor';
import { toast } from '@/hooks/use-toast';
import { UserCircle, LogIn } from 'lucide-react';

interface GroupChatProps {
  groupId: string;
  groupName: string;
  compact?: boolean;
}

const GroupChat: React.FC<GroupChatProps> = ({ 
  groupId, 
  groupName,
  compact = true
}) => {
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { currentUser, userProfile, loading, refetchProfile } = useUserProfile();
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  
  // Add state to track if we've tried to refresh the profile after an edit
  const [hasRefreshedAfterEdit, setHasRefreshedAfterEdit] = useState(false);

  // Ensure we have a valid UUID for the groupId
  const validGroupId = groupId === 'general' ? '00000000-0000-4000-8000-000000000000' : groupId;

  // Open user directory
  const handleOpenUserDirectory = () => {
    // Check if user is logged in
    if (!currentUser || currentUser === 'Gast') {
      setIsProfileEditorOpen(true);
      return;
    }
    
    setIsUserDirectoryOpen(true);
  };

  // Select user for private chat
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsUserDirectoryOpen(false);
    setIsPrivateChatOpen(true);
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    const updatedProfile = await refetchProfile();
    setHasRefreshedAfterEdit(true);
    
    if (updatedProfile) {
      toast({
        title: "Profil aktualisiert",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
    }
  };
  
  // Effect to force refresh profile when component mounts
  useEffect(() => {
    if (!hasRefreshedAfterEdit) {
      refetchProfile();
      setHasRefreshedAfterEdit(true);
    }
  }, [refetchProfile, hasRefreshedAfterEdit]);

  return (
    <div className="flex flex-col h-full">
      {/* Show login button if user is not logged in */}
      {(!currentUser || currentUser === 'Gast') ? (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-black rounded-lg">
          <p className="text-white text-center mb-4">
            Bitte melde dich an, um am Community-Chat teilzunehmen.
          </p>
          <Button 
            onClick={() => setIsProfileEditorOpen(true)} 
            className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Anmelden
          </Button>
        </div>
      ) : (
        <ChatGroup 
          groupId={validGroupId} 
          groupName={groupName}
          onOpenUserDirectory={handleOpenUserDirectory} 
        />
      )}

      {/* Login Status */}
      <div className="fixed bottom-4 right-4 bg-red-500/80 text-white rounded-full px-3 py-1 text-sm flex items-center shadow-lg z-50">
        <UserCircle className="w-4 h-4 mr-1" />
        <span>{loading ? "Verbinden..." : 
          currentUser && currentUser !== 'Gast' ? 
          `Angemeldet als ${currentUser}` : 
          "Nicht angemeldet"}</span>
        {(!currentUser || currentUser === 'Gast') && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-xs py-1 px-2 h-auto text-white hover:bg-red-600/50" 
            onClick={() => setIsProfileEditorOpen(true)}
          >
            Anmelden
          </Button>
        )}
      </div>

      {/* User directory dialog */}
      <UserDirectory
        open={isUserDirectoryOpen}
        onOpenChange={setIsUserDirectoryOpen}
        onSelectUser={handleSelectUser}
        currentUsername={currentUser}
      />

      {/* Private chat */}
      <PrivateChat
        open={isPrivateChatOpen}
        onOpenChange={setIsPrivateChatOpen}
        currentUser={currentUser}
        otherUser={selectedUser}
      />
      
      {/* Profile Editor dialog instead of Username dialog */}
      <ProfileEditor
        open={isProfileEditorOpen}
        onOpenChange={setIsProfileEditorOpen}
        currentUser={userProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default GroupChat;
