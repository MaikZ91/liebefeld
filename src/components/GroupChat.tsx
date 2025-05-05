
import React, { useState, useEffect, useRef } from 'react';
import ChatGroup from './chat/ChatGroup';
import { UserProfile } from '@/types/chatTypes';
import UserDirectory from './users/UserDirectory';
import PrivateChat from './users/PrivateChat';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { Button } from '@/components/ui/button';
import UsernameDialog from './chat/UsernameDialog';
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
  const { currentUser, userProfile, loading } = useUserProfile();
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  // Ensure we have a valid UUID for the groupId
  const validGroupId = groupId === 'general' ? '00000000-0000-4000-8000-000000000000' : groupId;

  // Benutzerverzeichnis öffnen
  const handleOpenUserDirectory = () => {
    // Überprüfen, ob der Benutzer angemeldet ist
    if (!currentUser || currentUser === 'Gast') {
      setIsUsernameModalOpen(true);
      return;
    }
    
    setIsUserDirectoryOpen(true);
  };

  // Benutzer für privaten Chat auswählen
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsUserDirectoryOpen(false);
    setIsPrivateChatOpen(true);
  };

  // Benutzernamen setzen
  const handleUsernameSet = (username: string) => {
    toast({
      title: "Willkommen " + username + "!",
      description: "Du kannst jetzt in den Gruppen chatten.",
      variant: "success"
    });
  };

  return (
    <>
      {/* Anmeldebutton anzeigen, wenn der Benutzer nicht angemeldet ist */}
      {(!currentUser || currentUser === 'Gast') ? (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p className="text-white text-center mb-4">
            Bitte melde dich an, um am Community-Chat teilzunehmen.
          </p>
          <Button 
            onClick={() => setIsUsernameModalOpen(true)} 
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

      {/* Login-Status anzeigen */}
      <div className="fixed bottom-4 right-4 bg-purple-900/80 text-white rounded-full px-3 py-1 text-sm flex items-center shadow-lg">
        <UserCircle className="w-4 h-4 mr-1" />
        <span>{loading ? "Verbinden..." : 
          currentUser && currentUser !== 'Gast' ? 
          `Angemeldet als ${currentUser}` : 
          "Nicht angemeldet"}</span>
        {(!currentUser || currentUser === 'Gast') && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-xs py-1 px-2 h-auto" 
            onClick={() => setIsUsernameModalOpen(true)}
          >
            Anmelden
          </Button>
        )}
      </div>

      {/* Benutzerverzeichnis-Dialog */}
      <UserDirectory
        open={isUserDirectoryOpen}
        onOpenChange={setIsUserDirectoryOpen}
        onSelectUser={handleSelectUser}
        currentUsername={currentUser}
      />

      {/* Privater Chat */}
      <PrivateChat
        open={isPrivateChatOpen}
        onOpenChange={setIsPrivateChatOpen}
        currentUser={currentUser}
        otherUser={selectedUser}
      />
      
      {/* Benutzernamen-Dialog */}
      <UsernameDialog
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        onUsernameSet={handleUsernameSet}
      />
    </>
  );
};

export default GroupChat;
