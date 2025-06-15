
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
    <ScrollArea className="h-[70vh] -mx-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
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
