import React, { useState, useEffect } from 'react';
import ChatGroup from './chat/ChatGroup';
import { UserProfile } from '@/types/chatTypes';
import UserDirectory from './users/UserDirectory';
import PrivateChat from './users/PrivateChat';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { Button } from '@/components/ui/button';
import ProfileEditor from './users/ProfileEditor';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, LogIn } from 'lucide-react';
import ChatLoadingSkeleton from './chat/ChatLoadingSkeleton';

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
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  // The groupName prop is now the source of truth, no need to recalculate it from the ID.
  const displayGroupName = groupName;

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
    
    if (updatedProfile) {
      toast({
        title: "Profil aktualisiert",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });
    }
  };
  
  // Effect to manage initialization state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // No loading skeleton - show content immediately

  return (
    <div className="flex flex-col h-full">
      {/* Show login button if user is not logged in */}
      {(!currentUser || currentUser === 'Gast') ? (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white">Willkommen bei THE TRIBE</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Melde dich an, um Teil unserer Community zu werden und mit anderen zu chatten.
            </p>
            <Button 
              onClick={() => setIsProfileEditorOpen(true)} 
              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/25"
            >
              <LogIn className="h-4 w-4" />
              Jetzt anmelden
            </Button>
          </div>
        </div>
      ) : (
        <ChatGroup 
          groupId={groupId} 
          groupName={displayGroupName}
          onOpenUserDirectory={handleOpenUserDirectory} 
        />
      )}

      {/* Login Status */}
      <div className="fixed bottom-20 right-4 bg-black/60 backdrop-blur-xl text-white rounded-2xl px-4 py-2 text-xs flex items-center shadow-2xl border border-white/10 z-50 transition-all duration-300">
        <UserCircle className="w-3 h-3 mr-2 text-primary" />
        <span className="text-white/80">{loading ? "Verbinden..." : 
          currentUser && currentUser !== 'Gast' ? 
          `${currentUser}` : 
          "Nicht angemeldet"}</span>
        {(!currentUser || currentUser === 'Gast') && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-xs py-1 px-2 h-auto text-primary hover:text-white hover:bg-primary/20 rounded-lg transition-all duration-300" 
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
