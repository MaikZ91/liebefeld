
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from '@/hooks/use-toast';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getRandomAvatar } from '@/utils/chatUIUtils';

interface UsernameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUsernameSet: (username: string) => void;
}

const UsernameDialog: React.FC<UsernameDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onUsernameSet 
}) => {
  const [tempUsername, setTempUsername] = useState("");

  const saveUsername = () => {
    if (tempUsername.trim()) {
      localStorage.setItem(USERNAME_KEY, tempUsername);
      
      const userAvatar = getRandomAvatar();
      localStorage.setItem(AVATAR_KEY, userAvatar);
      
      onUsernameSet(tempUsername);
      onOpenChange(false);
      
      toast({
        title: "Willkommen " + tempUsername + "!",
        description: "Du kannst jetzt in den Gruppen chatten.",
        variant: "success"
      });

      setTempUsername("");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4 sm:p-6">
        <DrawerHeader>
          <DrawerTitle>Wähle deinen Benutzernamen</DrawerTitle>
          <DrawerDescription>Dieser Name wird in den Gruppenchats angezeigt.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 py-4">
          <Input 
            placeholder="Dein Benutzername" 
            value={tempUsername} 
            onChange={(e) => setTempUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
          />
          <Button onClick={saveUsername} disabled={!tempUsername.trim()} className="w-full">
            Speichern
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UsernameDialog;
