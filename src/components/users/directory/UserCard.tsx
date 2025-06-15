
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

const placeholders = [
  'photo-1535268647677-300dbf3d78d1', // kitten
  'photo-1485833077593-4278bba3f11f', // deer
  'photo-1618160702438-9b02ab6515c9', // fruit
  'photo-1501286353178-1ec881214838', // monkey
];

const getPlaceholderUrl = (username: string) => {
  if (!username) return `https://images.unsplash.com/${placeholders[0]}?w=240&h=240&fit=crop&q=80`;
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % placeholders.length);
  const placeholderId = placeholders[index];
  return `https://images.unsplash.com/${placeholderId}?w=240&h=240&fit=crop&q=80`;
};


const UserCard: React.FC<UserCardProps> = ({ user, currentUsername, onSelectUser }) => {
  const isCurrentUser = user.username === currentUsername;
  const avatarSrc = user.avatar || getPlaceholderUrl(user.username);

  return (
    <Card
      className={`relative w-full aspect-square overflow-hidden rounded-lg group transition-all duration-300 transform hover:-translate-y-1 ${
        isCurrentUser 
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-2xl hover:shadow-red-500/20'
      }`}
      onClick={() => !isCurrentUser && onSelectUser(user)}
    >
      <img 
        src={avatarSrc} 
        alt={user.username} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-2 text-white flex flex-col justify-end h-full">
        <div className="flex-grow" /> {/* Spacer */}
        
        <div className="space-y-1 mb-1 text-xs">
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Heart className="h-3 w-3 text-red-400 shrink-0" />
              {user.interests.slice(0, 2).map(interest => (
                <Badge key={interest} variant="outline" className="text-xs px-1.5 py-0 bg-white/10 text-white backdrop-blur-sm border-none truncate">{interest}</Badge>
              ))}
            </div>
          )}
          {user.favorite_locations && user.favorite_locations.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
              {user.favorite_locations.slice(0, 1).map(location => (
                <Badge key={location} variant="outline" className="text-xs px-1.5 py-0 bg-white/10 text-white backdrop-blur-sm border-none truncate">{location}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{user.username}</h3>
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
