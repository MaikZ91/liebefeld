
import React, { useState, useEffect, useRef } from 'react';
import ChatGroup from './chat/ChatGroup';
import { UserProfile } from '@/types/chatTypes';
import UserDirectory from './users/UserDirectory';
import PrivateChat from './users/PrivateChat';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { Button } from '@/components/ui/button';
import UsernameDialog from './chat/UsernameDialog';
import { toast } from '@/hooks/use-toast';

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
  const { currentUser, updateLastOnline } = useUserProfile();
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  // Benutzerverzeichnis öffnen
  const handleOpenUserDirectory = () => {
    // Überprüfen, ob der Benutzer angemeldet ist
    if (!currentUser || currentUser === 'Gast') {
      setIsUsernameModalOpen(true);
      return;
    }
    
    updateLastOnline();
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

  // Anmeldebutton anzeigen, wenn der Benutzer nicht angemeldet ist
  if (!currentUser || currentUser === 'Gast') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-white text-center mb-4">
          Bitte melde dich an, um am Community-Chat teilzunehmen.
        </p>
        <Button 
          onClick={() => setIsUsernameModalOpen(true)} 
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Anmelden
        </Button>
        
        {/* Benutzernamen-Dialog */}
        <UsernameDialog
          isOpen={isUsernameModalOpen}
          onOpenChange={setIsUsernameModalOpen}
          onUsernameSet={handleUsernameSet}
        />
      </div>
    );
  }

  return (
    <>
      <ChatGroup 
        groupId={groupId} 
        groupName={groupName}
        onOpenUserDirectory={handleOpenUserDirectory} 
      />

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
