
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/chatTypes";
import { getInitials } from '@/utils/chatUIUtils';
import { Sparkles, Heart, MapPin } from 'lucide-react';

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
    <ScrollArea className="h-[60vh]">
      <div className="space-y-2 pr-4">
        {users.map(user => (
          <div
            key={user.id}
            className={`p-3 rounded-lg hover:bg-gray-900 cursor-pointer transition-colors ${
              user.username === currentUsername ? 'bg-gray-900 opacity-70' : ''
            }`}
            onClick={() => user.username !== currentUsername && onSelectUser(user)}
          >
            <div className="flex gap-3">
              <Avatar className="h-12 w-12 border border-gray-800">
                <AvatarImage src={user.avatar || ''} alt={user.username} />
                <AvatarFallback className="bg-red-500">{getInitials(user.username)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{user.username}</p>
                  {user.username !== currentUsername ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-500 text-red-500 hover:bg-red-600/10"
                    >
                      Chatten
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Du</span>
                  )}
                </div>
                
                <div className="flex items-center mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs text-gray-400">Online</span>
                </div>
                
                {/* Interests */}
                {user.interests && user.interests.length > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span>Interessen:</span>
                      <div className="flex flex-wrap gap-1">
                        {user.interests.map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Hobbies */}
                {user.hobbies && user.hobbies.length > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>Hobbys:</span>
                      <div className="flex flex-wrap gap-1">
                        {user.hobbies.map((hobby, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                            {hobby}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Favorite Locations */}
                {user.favorite_locations && user.favorite_locations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <MapPin className="h-3 w-3 text-blue-500" />
                      <span>Lieblingsorte:</span>
                      <div className="flex flex-wrap gap-1">
                        {user.favorite_locations.map((location, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default UserList;
