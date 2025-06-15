
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
    <ScrollArea className="h-[70vh]">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1">
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
