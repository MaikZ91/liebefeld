
import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInitials } from '@/utils/chatUIUtils';
import { Sparkles, Heart, MapPin } from 'lucide-react';

interface UserCardProps {
  user: UserProfile;
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUsername, onSelectUser }) => {
  const isCurrentUser = user.username === currentUsername;

  const renderBadges = (items: string[] | null | undefined, icon: React.ReactNode, label: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="w-full mb-2">
        <div className="flex items-center gap-1.5 mb-1 text-xs text-gray-400">
          {icon}
          <span>{label}:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {items.slice(0, 2).map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs font-normal">
              {item}
            </Badge>
          ))}
          {items.length > 2 && (
            <Badge variant="secondary" className="text-xs font-normal">
              +{items.length - 2}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      className={`w-full bg-gradient-to-br from-gray-900 to-black border-gray-800 hover:border-red-500/50 transition-all duration-300 transform hover:-translate-y-1 group ${
        isCurrentUser ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !isCurrentUser && onSelectUser(user)}
    >
      <CardContent className="p-4 flex flex-col items-center text-center h-full">
        <Avatar className="h-20 w-20 mb-3 border-4 border-gray-800 group-hover:border-red-500 transition-colors duration-300">
          <AvatarImage src={user.avatar || ''} alt={user.username} />
          <AvatarFallback className="bg-red-600 text-xl font-bold">{getInitials(user.username)}</AvatarFallback>
        </Avatar>
        
        <h3 className="font-bold text-lg text-white truncate w-full">{user.username}</h3>
        
        <div className="flex items-center mb-4">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          <span className="text-xs text-gray-400">Online</span>
        </div>

        <div className="w-full text-left text-gray-300 space-y-2 flex-grow">
            {renderBadges(user.interests, <Sparkles className="h-3 w-3 text-yellow-400" />, 'Interessen')}
            {renderBadges(user.hobbies, <Heart className="h-3 w-3 text-red-500" />, 'Hobbys')}
            {renderBadges(user.favorite_locations, <MapPin className="h-3 w-3 text-blue-400" />, 'Orte')}
        </div>
        
        <div className="mt-auto pt-4 w-full">
            {isCurrentUser ? (
              <Badge variant="outline" className="border-green-500 text-green-500">Das bist du</Badge>
            ) : (
              <Button 
                size="sm" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-transform duration-200 hover:scale-105"
              >
                Chatten
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
