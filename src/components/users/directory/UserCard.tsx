
import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Card } from "@/components/ui/card";

interface UserCardProps {
  user: UserProfile;
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUsername, onSelectUser }) => {
  const isCurrentUser = user.username === currentUsername;

  return (
    <Card
      className={`relative w-full aspect-[3/4] overflow-hidden rounded-lg group transition-all duration-300 transform hover:-translate-y-1 ${
        isCurrentUser 
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-2xl hover:shadow-red-500/20'
      }`}
      onClick={() => !isCurrentUser && onSelectUser(user)}
    >
      <img 
        src={user.avatar || `https://source.boringavatars.com/beam/120/${user.username}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`} 
        alt={user.username} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <div className="flex items-center gap-2">
            <h3 className="font-bold text-base truncate">{user.username}</h3>
            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
        </div>
      </div>
      
      {isCurrentUser && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          Du
        </div>
      )}
    </Card>
  );
};

export default UserCard;
