import React, { useState } from 'react';
import { UserProfile } from "@/types/chatTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, MessageSquare, X } from "lucide-react";
import { Button } from '@/components/ui/button';

interface UserCardProps {
  user: UserProfile;
  currentUsername?: string;
  onSelectUser: (user: UserProfile) => void;
}

const getPlaceholderUrl = () => {
  return '/lovable-uploads/7beda6d8-fab6-4174-9940-4f98999a6ce9.png';
};


const UserCard: React.FC<UserCardProps> = ({ user, currentUsername, onSelectUser }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isCurrentUser = user.username === currentUsername;
  const avatarSrc = user.avatar || getPlaceholderUrl();

  const handleCardClick = () => {
    if (!isCurrentUser) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleSelectUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectUser(user);
  };
  
  const handleCloseDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
  }

  return (
    <Card
      className={`relative w-full aspect-square overflow-hidden group transition-all duration-300 rounded-none ${
        isCurrentUser 
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer'
      } ${!isFlipped && !isCurrentUser ? 'hover:shadow-2xl hover:shadow-red-500/20 hover:ring-2 hover:ring-red-500/80 transform hover:-translate-y-1' : ''}`}
      onClick={handleCardClick}
    >
      <img 
        src={avatarSrc} 
        alt={user.username} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {!isFlipped && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white flex flex-col justify-end h-full">
            <div className="flex-grow" /> {/* Spacer */}
            
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-base truncate" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{user.username}</h3>
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0 border-2 border-black/50"></div>
            </div>
          </div>
        </>
      )}

      {isFlipped && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-4 text-white flex flex-col justify-between transition-opacity duration-300 animate-in fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg truncate" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{user.username}</h3>
              <button onClick={handleCloseDetails} className="p-1 -mr-2 -mt-2 rounded-full hover:bg-white/20">
                  <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto flex-grow my-4 text-xs pr-1">
              {user.interests && user.interests.length > 0 ? (
                  <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-400 shrink-0" />
                          <span className="font-semibold text-sm">Interessen</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                          {user.interests.map(interest => (
                          <Badge key={interest} variant="outline" className="text-xs px-2 py-0.5 bg-red-900/50 text-red-100 backdrop-blur-sm border-red-500/20">{interest}</Badge>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="text-gray-400 text-center py-4">Keine Interessen angegeben.</div>
              )}
              {user.favorite_locations && user.favorite_locations.length > 0 ? (
                  <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-400 shrink-0" />
                          <span className="font-semibold text-sm">Lieblingsorte</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                          {user.favorite_locations.map(location => (
                          <Badge key={location} variant="outline" className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-100 backdrop-blur-sm border-blue-500/20">{location}</Badge>
                          ))}
                      </div>
                  </div>
              ) : (
                <div className="text-gray-400 text-center py-4">Keine Lieblingsorte angegeben.</div>
              )}
            </div>

            <div className="shrink-0">
              <Button size="sm" className="w-full bg-red-500 hover:bg-red-600 text-white" onClick={handleSelectUser}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat starten
              </Button>
            </div>
        </div>
      )}
      
      {isCurrentUser && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
          Du
        </div>
      )}
    </Card>
  );
};

export default UserCard;
