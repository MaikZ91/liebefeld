
import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserCard from './directory/UserCard';

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
    <ScrollArea className="h-[60vh] -mx-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
        {users.map(user => (
          <UserCard 
            key={user.id}
            user={user}
            currentUsername={currentUsername}
            onSelectUser={onSelectUser}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default UserGallery;
