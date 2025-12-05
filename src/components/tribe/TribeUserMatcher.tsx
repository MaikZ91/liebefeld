import React, { useState, useEffect } from 'react';
import { UserProfile as ChatUserProfile } from '@/types/chatTypes';
import { UserProfile } from '@/types/tribe';
import { userService } from '@/services/userService';
import { Heart, X, MapPin, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TribeUserMatcherProps {
  currentUserProfile: UserProfile | null;
  onBack: () => void;
}

const calculateMatchScore = (currentUser: UserProfile | null, otherUser: ChatUserProfile): number => {
  if (!currentUser) return 0;

  let score = 0;
  let factors = 0;

  // Compare interests
  const currentInterests = currentUser.interests || [];
  const otherInterests = otherUser.interests || [];
  
  if (currentInterests.length > 0 && otherInterests.length > 0) {
    const commonInterests = currentInterests.filter(interest => 
      otherInterests.includes(interest)
    );
    const interestScore = (commonInterests.length / Math.max(currentInterests.length, otherInterests.length)) * 100;
    score += interestScore;
    factors++;
  }

  // Compare favorite locations
  const currentLocations = currentUser.favorite_locations || [];
  const otherLocations = otherUser.favorite_locations || [];
  
  if (currentLocations.length > 0 && otherLocations.length > 0) {
    const commonLocations = currentLocations.filter(loc => 
      otherLocations.includes(loc)
    );
    const locationScore = (commonLocations.length / Math.max(currentLocations.length, otherLocations.length)) * 100;
    score += locationScore;
    factors++;
  }

  // Compare hobbies if available
  const currentHobbies = currentUser.hobbies || [];
  const otherHobbies = otherUser.hobbies || [];
  
  if (currentHobbies.length > 0 && otherHobbies.length > 0) {
    const commonHobbies = currentHobbies.filter(hobby => 
      otherHobbies.includes(hobby)
    );
    const hobbyScore = (commonHobbies.length / Math.max(currentHobbies.length, otherHobbies.length)) * 100;
    score += hobbyScore;
    factors++;
  }

  return factors > 0 ? Math.round(score / factors) : 0;
};

const getCommonInterests = (currentUser: UserProfile | null, otherUser: ChatUserProfile): string[] => {
  if (!currentUser) return [];
  const currentInterests = currentUser.interests || [];
  const otherInterests = otherUser.interests || [];
  return currentInterests.filter(interest => otherInterests.includes(interest));
};

export const TribeUserMatcher: React.FC<TribeUserMatcherProps> = ({ 
  currentUserProfile,
  onBack 
}) => {
  const [users, setUsers] = useState<(ChatUserProfile & { matchScore?: number })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getUsers();
      
      // Filter out current user and sort by match score
      const filteredUsers = allUsers
        .filter(user => user.username !== currentUserProfile?.username)
        .map(user => ({
          ...user,
          matchScore: calculateMatchScore(currentUserProfile, user)
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Fehler beim Laden der User');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (direction === 'right' && currentUser) {
        toast.success(`Match mit ${currentUser.username}! 💫`);
      }
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const currentUser = users[currentIndex];
  const matchScore = currentUser ? calculateMatchScore(currentUserProfile, currentUser) : 0;
  const commonInterests = currentUser ? getCommonInterests(currentUserProfile, currentUser) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 text-gold animate-pulse mx-auto" />
          <p className="text-zinc-400">Lade User...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 px-6">
          <Sparkles className="h-16 w-16 text-gold mx-auto" />
          <h2 className="text-2xl font-serif text-gold">Keine weiteren User</h2>
          <p className="text-zinc-400">Du hast alle verfügbaren User gesehen</p>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-serif text-gold">USER MATCHER</h1>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Card Stack */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="relative aspect-[3/4] mb-8">
          {currentUser && (
            <div 
              className={`absolute inset-0 rounded-2xl overflow-hidden border border-zinc-800 transition-transform duration-300 ${
                swipeDirection === 'left' ? '-translate-x-[120%] rotate-[-20deg]' :
                swipeDirection === 'right' ? 'translate-x-[120%] rotate-[20deg]' :
                ''
              }`}
            >
              {/* User Image */}
              <div className="absolute inset-0">
                <img 
                  src={currentUser.avatar || '/lovable-uploads/7beda6d8-fab6-4174-9940-4f98999a6ce9.png'} 
                  alt={currentUser.username}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>

              {/* Match Score Badge */}
              <div className="absolute top-4 right-4 bg-gold/90 backdrop-blur-sm text-black px-4 py-2 rounded-full font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {matchScore}% Match
              </div>

              {/* User Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{currentUser.username}</h2>
                  {(currentUser as any).homebase && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      <span>{(currentUser as any).homebase}</span>
                    </div>
                  )}
                  {!((currentUser as any).homebase) && currentUser.favorite_locations && currentUser.favorite_locations.length > 0 && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      <span>{currentUser.favorite_locations[0]}</span>
                    </div>
                  )}
                </div>

                {/* Common Interests */}
                {commonInterests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gold uppercase tracking-wider">Gemeinsame Interessen</p>
                    <div className="flex flex-wrap gap-2">
                      {commonInterests.map(interest => (
                        <Badge 
                          key={interest}
                          className="bg-gold/20 text-gold border-gold/30"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Interests */}
                {currentUser.interests && currentUser.interests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Interessen</p>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.interests.map(interest => (
                        <Badge 
                          key={interest}
                          variant="outline"
                          className="border-zinc-700 text-zinc-300"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => handleSwipe('left')}
            className="h-16 w-16 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center hover:border-red-500 hover:bg-red-500/10 transition-colors group"
          >
            <X className="h-8 w-8 text-zinc-400 group-hover:text-red-500" />
          </button>
          <button
            onClick={() => handleSwipe('right')}
            className="h-20 w-20 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-gold/20"
          >
            <Heart className="h-10 w-10 text-black fill-black" />
          </button>
        </div>

        {/* Counter */}
        <div className="mt-6 text-center text-zinc-500 text-sm">
          {currentIndex + 1} / {users.length}
        </div>
      </div>
    </div>
  );
};
