
import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/utils/chatUIUtils';
import { Button } from "@/components/ui/button";
import { Users } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserGalleryProps {
  users: UserProfile[];
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserGallery: React.FC<UserGalleryProps> = ({
  users,
  currentUsername,
  onSelectUser
}) => {
  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
        {users.map(user => (
          <div
            key={user.id}
            className={`flex flex-col items-center p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors ${
              user.username === currentUsername ? 'opacity-70' : ''
            }`}
            onClick={() => user.username !== currentUsername && onSelectUser(user)}
          >
            <Avatar className="h-16 w-16 mb-3 border-2 border-red-500/50">
              <AvatarImage src={user.avatar || ''} alt={user.username} />
              <AvatarFallback className="bg-red-500 text-lg">{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            
            <h3 className="font-medium text-center mb-1">{user.username}</h3>
            
            <div className="flex items-center mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
            
            {user.username !== currentUsername ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full border-red-500 text-red-500 hover:bg-red-600/10"
              >
                Chatten
              </Button>
            ) : (
              <span className="text-xs text-gray-400 italic mt-2">Du</span>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default UserGallery;
