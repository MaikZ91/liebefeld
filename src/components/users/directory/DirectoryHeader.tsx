
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCog, LogIn } from 'lucide-react';

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
        {/* Always show the profile/login button */}
        <Button 
          variant="outline" 
          size="icon"
          onClick={onOpenProfileEditor}
          className="h-8 w-8 border-gray-700 text-white hover:text-red-400 hover:border-red-500"
          title={currentUsername && currentUsername !== 'Gast' ? "Profil bearbeiten" : "Anmelden"}
        >
          {currentUsername && currentUsername !== 'Gast' ? (
            <UserCog className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
        </Button>
      </div>
    </DialogHeader>
  );
};

export default DirectoryHeader;
