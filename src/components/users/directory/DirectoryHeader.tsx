
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserProfileButton from '@/components/UserProfileButton';

interface DirectoryHeaderProps {
  currentUsername?: string;
  onOpenProfileEditor: () => void;
}

const DirectoryHeader: React.FC<DirectoryHeaderProps> = ({
  currentUsername,
  onOpenProfileEditor
}) => {
  return (
    <DialogHeader className="flex flex-row items-center justify-between">
      <DialogTitle className="text-white">Online Benutzer</DialogTitle>
      <div className="flex items-center gap-2">
        <UserProfileButton 
          avatarOnly={true}
          onAvatarClick={onOpenProfileEditor}
        />
      </div>
    </DialogHeader>
  );
};

export default DirectoryHeader;
