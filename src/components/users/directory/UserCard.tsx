import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin } from "lucide-react";

interface UserCardProps {
  user: UserProfile;
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const getPlaceholderUrl = () => {
  return '/placeholder.svg';
};


const UserCard: React.FC<UserCardProps> = ({ user, currentUsername, onSelectUser }) => {
  const isCurrentUser = user.username === currentUsername;
  const avatarSrc = user.avatar || getPlaceholderUrl();

  return (
    <Card
      className={`relative w-full aspect-[4/5] overflow-hidden rounded-xl group transition-all duration-300 ${
        isCurrentUser 
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-2xl hover:shadow-red-500/20 hover:ring-2 hover:ring-red-500/80 transform hover:-translate-y-1'
      }`}
      onClick={() => !isCurrentUser && onSelectUser(user)}
    >
      <img 
        src={avatarSrc} 
        alt={user.username} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white flex flex-col justify-end h-full">
        <div className="flex-grow" /> {/* Spacer */}
        
        <div className="space-y-1.5 mb-1.5 text-xs">
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <Heart className="h-3.5 w-3.5 text-red-400 shrink-0" />
              {user.interests.slice(0, 2).map(interest => (
                <Badge key={interest} variant="outline" className="text-xs px-2 py-0.5 bg-red-900/50 text-red-100 backdrop-blur-sm border-red-500/20 truncate">{interest}</Badge>
              ))}
            </div>
          )}
          {user.favorite_locations && user.favorite_locations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              {user.favorite_locations.slice(0, 1).map(location => (
                <Badge key={location} variant="outline" className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-100 backdrop-blur-sm border-blue-500/20 truncate">{location}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
            <h3 className="font-bold text-base truncate" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{user.username}</h3>
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0 border-2 border-black/50"></div>
        </div>
      </div>
      
      {isCurrentUser && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
          Du
        </div>
      )}
    </Card>
  );
};

export default UserCard;
