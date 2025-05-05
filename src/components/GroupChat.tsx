import React, { useState, useEffect, useRef } from 'react';
import ChatGroup from './chat/ChatGroup';
import { UserProfile } from '@/types/chatTypes';
import UserDirectory from './users/UserDirectory';
import PrivateChat from './users/PrivateChat';
import { useUserProfile } from '@/hooks/chat/useUserProfile';

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

  // Benutzerverzeichnis öffnen
  const handleOpenUserDirectory = () => {
    updateLastOnline();
    setIsUserDirectoryOpen(true);
  };

  // Benutzer für privaten Chat auswählen
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsUserDirectoryOpen(false);
    setIsPrivateChatOpen(true);
  };

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
    </>
  );
};

export default GroupChat;
