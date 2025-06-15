
import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from '@/utils/chatUIUtils';
import { Sparkles, Heart, MapPin, ChevronRight } from 'lucide-react';

interface UserListItemProps {
  user: UserProfile;
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, currentUsername, onSelectUser }) => {
  const isCurrentUser = user.username === currentUsername;

  const renderDetail = (items: string[] | null | undefined, icon: React.ReactNode, label: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-24 flex items-center gap-2 shrink-0">
          {icon}
          <span className="font-semibold text-gray-300">{label}:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((item, index) => (
            <Badge key={index} variant="secondary" className="font-normal">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${
        isCurrentUser 
          ? 'bg-gray-800/30' 
          : 'hover:bg-gray-800/50 cursor-pointer'
      }`}
      onClick={() => !isCurrentUser && onSelectUser(user)}
    >
      <Avatar className="h-14 w-14 mr-4 border-2 border-gray-700">
        <AvatarImage src={user.avatar || ''} alt={user.username} />
        <AvatarFallback className="bg-red-600 font-bold">{getInitials(user.username)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="font-bold text-white text-base">{user.username}</p>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
          {isCurrentUser && <Badge variant="outline" className="border-green-500 text-green-500">Das bist du</Badge>}
        </div>

        <div className="mt-2 space-y-1.5">
          {renderDetail(user.interests, <Sparkles className="h-3 w-3 text-yellow-400" />, 'Interessen')}
          {renderDetail(user.hobbies, <Heart className="h-3 w-3 text-red-500" />, 'Hobbys')}
          {renderDetail(user.favorite_locations, <MapPin className="h-3 w-3 text-blue-400" />, 'Lieblingsorte')}
        </div>
      </div>
      
      {!isCurrentUser && (
        <div className="ml-4">
            <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
        </div>
      )}
    </div>
  );
};

export default UserListItem;
