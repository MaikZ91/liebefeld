
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfile } from "@/types/chatTypes";
import UserListItem from './UserListItem';

interface UserListProps {
  users: UserProfile[];
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  currentUsername,
  onSelectUser
}) => {
  return (
    <ScrollArea className="h-[60vh] -mx-6">
      <div className="space-y-1 px-4">
        {users.map(user => (
          <UserListItem 
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

export default UserList;
