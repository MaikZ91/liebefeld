import React from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MapPin, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
  loading?: boolean;
}

const getPlaceholderUrl = () => {
  return '/lovable-uploads/7beda6d8-fab6-4174-9940-4f98999a6ce9.png';
};

const getInitials = (username: string): string => {
  return username
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onOpenChange,
  userProfile,
  loading = false
}) => {
  if (!userProfile && !loading) return null;

  const avatarSrc = userProfile?.avatar || getPlaceholderUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-black border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Benutzerprofil</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : userProfile ? (
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-red-500">
                <AvatarImage src={avatarSrc} alt={userProfile.username} />
                <AvatarFallback className="bg-red-500 text-white text-2xl">
                  {getInitials(userProfile.username)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">{userProfile.username}</h3>
                {userProfile.last_online && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Zuletzt online: {format(new Date(userProfile.last_online), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interests */}
            {userProfile.interests && userProfile.interests.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  <span className="font-semibold text-white">Interessen</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.interests.map(interest => (
                    <Badge 
                      key={interest} 
                      variant="outline" 
                      className="bg-red-900/50 text-red-100 border-red-500/20"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Locations */}
            {userProfile.favorite_locations && userProfile.favorite_locations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-white">Lieblingsorte</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.favorite_locations.map(location => (
                    <Badge 
                      key={location} 
                      variant="outline" 
                      className="bg-blue-900/50 text-blue-100 border-blue-500/20"
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Hobbies */}
            {userProfile.hobbies && userProfile.hobbies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-white">Hobbies</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.hobbies.map(hobby => (
                    <Badge 
                      key={hobby} 
                      variant="outline" 
                      className="bg-green-900/50 text-green-100 border-green-500/20"
                    >
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!userProfile.interests || userProfile.interests.length === 0) &&
             (!userProfile.favorite_locations || userProfile.favorite_locations.length === 0) &&
             (!userProfile.hobbies || userProfile.hobbies.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Profilinformationen verfügbar.</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;